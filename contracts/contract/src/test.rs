#![cfg(test)]

use crate::{LeaderboardContract, LeaderboardContractClient, ScoringType};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, LeaderboardContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(LeaderboardContract, ());
    let client = LeaderboardContractClient::new(&env, &id);
    (env, client)
}

#[test]
fn test_create_leaderboard() {
    let (env, client) = setup();
    let creator = Address::generate(&env);

    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Stellar Racer"),
        &creator,
        &ScoringType::HighestWins,
        &10,
    );
    assert_eq!(lb_id, 0);

    // Second leaderboard gets id 1
    let lb_id2 = client.create_leaderboard(
        &String::from_str(&env, "Space Blaster"),
        &creator,
        &ScoringType::LowestWins,
        &5,
    );
    assert_eq!(lb_id2, 1);
}

#[test]
fn test_submit_and_rank_highest_wins() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Stellar Racer"),
        &creator,
        &ScoringType::HighestWins,
        &10,
    );

    client.submit_score(&lb_id, &alice, &9500);
    client.submit_score(&lb_id, &bob, &12000);
    client.submit_score(&lb_id, &carol, &7800);

    let ranked = client.get_leaderboard(&lb_id);
    assert_eq!(ranked.len(), 3);
    assert_eq!(ranked.get(0).unwrap().score, 12000); // bob
    assert_eq!(ranked.get(0).unwrap().rank, 1);
    assert_eq!(ranked.get(1).unwrap().score, 9500);  // alice
    assert_eq!(ranked.get(2).unwrap().score, 7800);  // carol
}

#[test]
fn test_submit_and_rank_lowest_wins() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Speed Run"),
        &creator,
        &ScoringType::LowestWins,
        &10,
    );

    client.submit_score(&lb_id, &alice, &300); // faster
    client.submit_score(&lb_id, &bob, &500);

    let ranked = client.get_leaderboard(&lb_id);
    assert_eq!(ranked.get(0).unwrap().score, 300); // alice wins
    assert_eq!(ranked.get(0).unwrap().rank, 1);
}

#[test]
fn test_score_update_replaces_existing() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);

    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Stellar Racer"),
        &creator,
        &ScoringType::HighestWins,
        &10,
    );

    client.submit_score(&lb_id, &alice, &5000);
    client.submit_score(&lb_id, &alice, &9999); // update

    let ranked = client.get_leaderboard(&lb_id);
    assert_eq!(ranked.len(), 1);
    assert_eq!(ranked.get(0).unwrap().score, 9999);
}

#[test]
fn test_max_entries_drops_worst() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    // max_entries = 2
    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Tiny Board"),
        &creator,
        &ScoringType::HighestWins,
        &2,
    );

    client.submit_score(&lb_id, &alice, &1000);
    client.submit_score(&lb_id, &bob, &2000);
    // carol's 3000 should push alice (lowest) out
    client.submit_score(&lb_id, &carol, &3000);

    let ranked = client.get_leaderboard(&lb_id);
    assert_eq!(ranked.len(), 2);
    // alice (1000) should be gone
    for entry in ranked.iter() {
        assert_ne!(entry.player, alice);
    }
    assert_eq!(ranked.get(0).unwrap().score, 3000);
    assert_eq!(ranked.get(1).unwrap().score, 2000);
}

#[test]
fn test_get_player_rank() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Stellar Racer"),
        &creator,
        &ScoringType::HighestWins,
        &10,
    );

    client.submit_score(&lb_id, &alice, &7800);
    client.submit_score(&lb_id, &bob, &12000);

    let entry = client.get_player_rank(&lb_id, &alice);
    assert_eq!(entry.rank, 2);
    assert_eq!(entry.score, 7800);

    let top = client.get_player_rank(&lb_id, &bob);
    assert_eq!(top.rank, 1);
}

#[test]
fn test_multiple_leaderboards_independent() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);

    let lb1 = client.create_leaderboard(
        &String::from_str(&env, "Game A"),
        &creator,
        &ScoringType::HighestWins,
        &10,
    );
    let lb2 = client.create_leaderboard(
        &String::from_str(&env, "Game B"),
        &creator,
        &ScoringType::LowestWins,
        &10,
    );

    client.submit_score(&lb1, &alice, &500);
    client.submit_score(&lb2, &alice, &100);

    let r1 = client.get_leaderboard(&lb1);
    let r2 = client.get_leaderboard(&lb2);
    assert_eq!(r1.get(0).unwrap().score, 500);
    assert_eq!(r2.get(0).unwrap().score, 100);
}

#[test]
fn test_lowest_wins_max_entries_drops_worst() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Speedrun"),
        &creator,
        &ScoringType::LowestWins,
        &2,
    );

    client.submit_score(&lb_id, &alice, &200);
    client.submit_score(&lb_id, &bob, &150);
    // carol's 120 is best; alice (200) is worst and should be dropped
    client.submit_score(&lb_id, &carol, &120);

    let ranked = client.get_leaderboard(&lb_id);
    assert_eq!(ranked.len(), 2);
    assert_eq!(ranked.get(0).unwrap().score, 120); // carol
    assert_eq!(ranked.get(1).unwrap().score, 150); // bob
    for entry in ranked.iter() {
        assert_ne!(entry.player, alice);
    }
}

#[test]
fn test_score_update_does_not_grow_list() {
    let (env, client) = setup();
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let lb_id = client.create_leaderboard(
        &String::from_str(&env, "Stable Board"),
        &creator,
        &ScoringType::HighestWins,
        &10,
    );

    client.submit_score(&lb_id, &alice, &1000);
    client.submit_score(&lb_id, &bob, &2000);
    // update alice three times — list must stay at 2
    client.submit_score(&lb_id, &alice, &1500);
    client.submit_score(&lb_id, &alice, &1800);
    client.submit_score(&lb_id, &alice, &3000);

    let ranked = client.get_leaderboard(&lb_id);
    assert_eq!(ranked.len(), 2);
    assert_eq!(ranked.get(0).unwrap().score, 3000);
}

// ── Inter-contract tests ──────────────────────────────────────────────────────

#[test]
fn test_inter_contract_new_champion() {
    use reward_oracle::{RewardOracle, RewardOracleClient};

    let env = Env::default();
    env.mock_all_auths();

    // Register both contracts in the same test environment.
    let lb_id = env.register(LeaderboardContract, ());
    let oracle_id = env.register(RewardOracle, ());

    let lb_client = LeaderboardContractClient::new(&env, &lb_id);
    let oracle_client = RewardOracleClient::new(&env, &oracle_id);

    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let board = lb_client.create_leaderboard(
        &String::from_str(&env, "Cross-Contract Game"),
        &creator,
        &ScoringType::HighestWins,
        &10,
    );

    // Alice submits 5000 — becomes first champion.
    let alice_crowned = lb_client.submit_score_with_oracle(
        &board, &alice, &5000, &oracle_id,
    );
    assert!(alice_crowned);

    let champ = oracle_client.get_champion(&board).unwrap();
    assert_eq!(champ.player, alice);
    assert_eq!(champ.score, 5000);

    // Bob submits 3000 — lower, should NOT become champion.
    let bob_crowned = lb_client.submit_score_with_oracle(
        &board, &bob, &3000, &oracle_id,
    );
    assert!(!bob_crowned);

    // Bob submits 9000 — higher, should become new champion.
    let bob_crowned2 = lb_client.submit_score_with_oracle(
        &board, &bob, &9000, &oracle_id,
    );
    assert!(bob_crowned2);

    let champ2 = oracle_client.get_champion(&board).unwrap();
    assert_eq!(champ2.player, bob);
    assert_eq!(champ2.score, 9000);
}

#[test]
fn test_inter_contract_lowest_wins_champion() {
    use reward_oracle::{RewardOracle, RewardOracleClient};

    let env = Env::default();
    env.mock_all_auths();

    let lb_id = env.register(LeaderboardContract, ());
    let oracle_id = env.register(RewardOracle, ());

    let lb_client = LeaderboardContractClient::new(&env, &lb_id);
    let oracle_client = RewardOracleClient::new(&env, &oracle_id);

    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let board = lb_client.create_leaderboard(
        &String::from_str(&env, "Speedrun"),
        &creator,
        &ScoringType::LowestWins,
        &10,
    );

    lb_client.submit_score_with_oracle(&board, &alice, &500, &oracle_id);
    // bob's 300 is better (lower) — should crown bob
    let crowned = lb_client.submit_score_with_oracle(&board, &bob, &300, &oracle_id);
    assert!(crowned);

    let champ = oracle_client.get_champion(&board).unwrap();
    assert_eq!(champ.player, bob);
    assert_eq!(champ.score, 300);
}
