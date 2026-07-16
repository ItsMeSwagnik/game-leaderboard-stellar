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
