#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env};

/// Storage key: champion record per leaderboard id.
#[contracttype]
#[derive(Clone)]
pub enum OracleKey {
    Champion(u64), // leaderboard_id → ChampionRecord
}

/// The all-time best score record for a leaderboard.
#[contracttype]
#[derive(Clone)]
pub struct ChampionRecord {
    pub player: Address,
    pub score: u64,
    pub leaderboard_id: u64,
}

#[contract]
pub struct RewardOracle;

#[contractimpl]
impl RewardOracle {
    /// Called by the leaderboard contract when a new score is submitted.
    /// Updates the champion record if `score` beats the current best.
    /// Returns true if a new champion was crowned.
    pub fn record_champion(
        env: Env,
        leaderboard_id: u64,
        player: Address,
        score: u64,
        highest_wins: bool,
    ) -> bool {
        let key = OracleKey::Champion(leaderboard_id);

        let is_new_champion = match env.storage().persistent().get::<OracleKey, ChampionRecord>(&key) {
            Some(current) => {
                if highest_wins {
                    score > current.score
                } else {
                    score < current.score
                }
            }
            None => true, // first entry is always champion
        };

        if is_new_champion {
            env.storage().persistent().set(
                &key,
                &ChampionRecord { player: player.clone(), score, leaderboard_id },
            );
            env.storage().persistent().extend_ttl(&key, 100, 100);
            env.events().publish(
                (symbol_short!("new_champ"), leaderboard_id),
                (player, score),
            );
        }

        is_new_champion
    }

    /// Returns the current champion for a leaderboard, or None.
    pub fn get_champion(env: Env, leaderboard_id: u64) -> Option<ChampionRecord> {
        env.storage()
            .persistent()
            .get(&OracleKey::Champion(leaderboard_id))
    }
}

mod test;
