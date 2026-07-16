#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

// ── Storage key types ────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    LeaderboardCount,
    Leaderboard(u64),
    Scores(u64),       // Vec<ScoreEntry> for leaderboard id
}

// ── Data types ───────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum ScoringType {
    HighestWins,
    LowestWins,
}

#[contracttype]
#[derive(Clone)]
pub struct Leaderboard {
    pub id: u64,
    pub name: String,
    pub creator: Address,
    pub scoring_type: ScoringType,
    pub max_entries: u32,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct ScoreEntry {
    pub player: Address,
    pub score: u64,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct RankedEntry {
    pub rank: u32,
    pub player: Address,
    pub score: u64,
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct LeaderboardContract;

#[contractimpl]
impl LeaderboardContract {
    /// Anyone can create a leaderboard. Returns the new leaderboard id.
    pub fn create_leaderboard(
        env: Env,
        name: String,
        creator: Address,
        scoring_type: ScoringType,
        max_entries: u32,
    ) -> u64 {
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::LeaderboardCount)
            .unwrap_or(0u64);

        let lb = Leaderboard {
            id,
            name,
            creator,
            scoring_type,
            max_entries,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Leaderboard(id), &lb);
        env.storage()
            .persistent()
            .set(&DataKey::Scores(id), &Vec::<ScoreEntry>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::LeaderboardCount, &(id + 1));
        env.storage().instance().extend_ttl(100, 100);

        id
    }

    /// Anyone can submit a score for any leaderboard.
    /// If the player already has an entry it is replaced; otherwise appended
    /// (up to max_entries — oldest entry is dropped when full).
    pub fn submit_score(env: Env, leaderboard_id: u64, player: Address, score: u64) {
        let lb: Leaderboard = env
            .storage()
            .persistent()
            .get(&DataKey::Leaderboard(leaderboard_id))
            .unwrap();

        let scores: Vec<ScoreEntry> = env
            .storage()
            .persistent()
            .get(&DataKey::Scores(leaderboard_id))
            .unwrap_or(Vec::new(&env));

        // Replace existing entry for this player, if any.
        let mut found = false;
        let mut new_scores: Vec<ScoreEntry> = Vec::new(&env);
        for entry in scores.iter() {
            if entry.player == player {
                new_scores.push_back(ScoreEntry {
                    player: player.clone(),
                    score,
                    timestamp: env.ledger().timestamp(),
                });
                found = true;
            } else {
                new_scores.push_back(entry);
            }
        }

        if !found {
            // Enforce max_entries: drop the lowest-ranked entry when full.
            if new_scores.len() >= lb.max_entries {
                new_scores = Self::drop_worst(&env, &new_scores, &lb.scoring_type);
            }
            new_scores.push_back(ScoreEntry {
                player,
                score,
                timestamp: env.ledger().timestamp(),
            });
        }

        env.storage()
            .persistent()
            .set(&DataKey::Scores(leaderboard_id), &new_scores);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Scores(leaderboard_id), 100, 100);
    }

    /// Returns the leaderboard sorted by rank (best first).
    pub fn get_leaderboard(env: Env, leaderboard_id: u64) -> Vec<RankedEntry> {
        let lb: Leaderboard = env
            .storage()
            .persistent()
            .get(&DataKey::Leaderboard(leaderboard_id))
            .unwrap();

        let scores: Vec<ScoreEntry> = env
            .storage()
            .persistent()
            .get(&DataKey::Scores(leaderboard_id))
            .unwrap_or(Vec::new(&env));

        let sorted = Self::sort_scores(&env, &scores, &lb.scoring_type);
        let mut result: Vec<RankedEntry> = Vec::new(&env);
        let mut rank: u32 = 1;
        for entry in sorted.iter() {
            result.push_back(RankedEntry {
                rank,
                player: entry.player.clone(),
                score: entry.score,
            });
            rank += 1;
        }
        result
    }

    /// Returns the rank and score of a specific player, or panics if not found.
    pub fn get_player_rank(env: Env, leaderboard_id: u64, player: Address) -> RankedEntry {
        let ranked = Self::get_leaderboard(env.clone(), leaderboard_id);
        for entry in ranked.iter() {
            if entry.player == player {
                return entry;
            }
        }
        panic!("player not found");
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    fn sort_scores(env: &Env, scores: &Vec<ScoreEntry>, scoring_type: &ScoringType) -> Vec<ScoreEntry> {
        // Collect into a fixed-size array via repeated selection sort (no alloc).
        let n = scores.len() as usize;
        let mut sorted: Vec<ScoreEntry> = scores.clone();

        // Simple O(n²) selection sort — leaderboards are small (max_entries bounded).
        for i in 0..n {
            let mut best_idx = i;
            for j in (i + 1)..n {
                let a = sorted.get(j as u32).unwrap();
                let b = sorted.get(best_idx as u32).unwrap();
                let a_better = match scoring_type {
                    ScoringType::HighestWins => a.score > b.score,
                    ScoringType::LowestWins => a.score < b.score,
                };
                if a_better {
                    best_idx = j;
                }
            }
            if best_idx != i {
                let tmp_a = sorted.get(i as u32).unwrap();
                let tmp_b = sorted.get(best_idx as u32).unwrap();
                sorted.set(i as u32, tmp_b);
                sorted.set(best_idx as u32, tmp_a);
            }
        }
        let _ = env; // suppress unused warning
        sorted
    }

    fn drop_worst(env: &Env, scores: &Vec<ScoreEntry>, scoring_type: &ScoringType) -> Vec<ScoreEntry> {
        // Find the index of the worst entry and remove it.
        let n = scores.len();
        if n == 0 {
            return scores.clone();
        }
        let mut worst_idx: u32 = 0;
        for i in 1..n {
            let a = scores.get(i).unwrap();
            let b = scores.get(worst_idx).unwrap();
            let a_worse = match scoring_type {
                ScoringType::HighestWins => a.score < b.score,
                ScoringType::LowestWins => a.score > b.score,
            };
            if a_worse {
                worst_idx = i;
            }
        }
        let mut result: Vec<ScoreEntry> = Vec::new(env);
        for i in 0..n {
            if i != worst_idx {
                result.push_back(scores.get(i).unwrap());
            }
        }
        result
    }
}

mod test;
