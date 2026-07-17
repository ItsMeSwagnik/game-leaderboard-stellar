# 🏆 StellarRank — Permissionless Game Leaderboard on Stellar (Soroban)

<img width="1917" height="1022" alt="image" src="https://github.com/user-attachments/assets/e0b3c77a-5f8a-4e34-bbfe-2970e2da790b" />

<img width="1917" height="1025" alt="image" src="https://github.com/user-attachments/assets/e45c4d85-e14f-43fc-80ab-411cfd99258f" />

<img width="1917" height="1016" alt="image" src="https://github.com/user-attachments/assets/fd85bc45-66e8-4f29-b317-0e7caa4c263a" />


A fully decentralized, permissionless game leaderboard protocol built with **Soroban smart contracts** on the **Stellar blockchain**. No admins. No gatekeepers. Anyone can create a game, submit scores, and climb the ranks — all on-chain.

---

## 📌 Project Description

StellarRank is a Soroban smart contract that lets game developers and communities deploy on-chain leaderboards without any centralized authority. There is no owner, no admin role, and no approval flow. The contract is open by design — create a leaderboard, submit your score, and let the chain decide your rank.

---

## ⚙️ What It Does

- Anyone can **create a leaderboard** for any game by providing a name, scoring method, and max entry count
- Anyone can **submit a score** to any leaderboard — existing scores are automatically updated if the player re-submits
- The contract **auto-ranks** all players on every submission using an on-chain selection sort
- When a leaderboard hits `max_entries`, the **worst-ranked player is automatically dropped** to make room
- Anyone can **query the full ranked leaderboard** or look up a specific player's rank and score
- All data is stored on-chain using Soroban **persistent storage** with TTL management

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔓 Fully Permissionless | No owner, admin, or moderator — anyone can interact |
| 🎮 Create Leaderboards | Set game name, scoring type (Highest/Lowest wins), and max entries |
| 📊 Submit Scores | Players submit scores directly; existing entries are replaced automatically |
| 🏅 Auto Ranking | Rankings computed on-chain, sorted best-first on every submission |
| 🚫 Max Entries Enforcement | Worst entry is dropped when the board is full |
| 🔍 Public Queries | `get_leaderboard` and `get_player_rank` are open read functions |
| ⏱️ TTL Management | Persistent storage TTLs are extended on every write to prevent archival |
| 🔁 Dual Scoring Modes | `HighestWins` (e.g. arcade scores) and `LowestWins` (e.g. speedruns) |

---

## 📂 Contract Structure

```
contracts/contract/src/
├── lib.rs       # Main contract logic
└── test.rs      # Unit tests
frontend/
├── app/         # React + Vite frontend
└── packages/
    └── game_leaderboard/   # Auto-generated Stellar contract bindings
```

### Data Types

```rust
// Scoring mode
enum ScoringType { HighestWins, LowestWins }

// Stored leaderboard metadata
struct Leaderboard {
    id: u64,
    name: String,
    creator: Address,
    scoring_type: ScoringType,
    max_entries: u32,
    created_at: u64,
}

// Raw score entry in storage
struct ScoreEntry {
    player: Address,
    score: u64,
    timestamp: u64,
}

// Returned ranked entry
struct RankedEntry {
    rank: u32,
    player: Address,
    score: u64,
}
```

---

## 📋 Contract Functions

### `create_leaderboard(name, creator, scoring_type, max_entries) → u64`
Creates a new leaderboard and returns its ID. No approval needed.

### `submit_score(leaderboard_id, player, score)`
Submits or updates a player's score. Automatically re-ranks all entries. Drops the worst entry if the board is full.

### `get_leaderboard(leaderboard_id) → Vec<RankedEntry>`
Returns all entries sorted by rank (best first).

```json
[
  { "rank": 1, "player": "GABC...", "score": 12000 },
  { "rank": 2, "player": "GXYZ...", "score": 9500 }
]
```

### `get_player_rank(leaderboard_id, player) → RankedEntry`
Returns a specific player's current rank and score.

---

## 🔐 Permission Model

| Action | Permission |
|---|---|
| Create leaderboard | ✅ Anyone |
| Submit score | ✅ Anyone |
| View leaderboard | ✅ Anyone |
| View player rank | ✅ Anyone |
| Delete leaderboard | ❌ Not allowed |
| Edit leaderboard | ❌ Not allowed |
| Ban player | ❌ Not allowed |
| Approve scores | ❌ Not allowed |

---

## 🚀 Setup & Local Development

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) + `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)
- [Node.js](https://nodejs.org/) v18+

```bash
# Install Rust wasm target
rustup target add wasm32v1-none
```

### 1. Clone & Install

```bash
git clone <repo-url>
cd "Game Leaderboard Stellar"
npm install
```

### 2. Build the Smart Contract

```bash
cd contracts
stellar contract build
```

Output: `contracts/target/wasm32v1-none/release/contract.wasm`

### 3. Deploy to Testnet

```bash
# Generate & fund a testnet identity
stellar keys generate swag --network testnet --fund

# Deploy
stellar contract deploy \
  --wasm contracts/target/wasm32v1-none/release/contract.wasm \
  --source-account swag \
  --network testnet \
  --alias game_leaderboard
```

### 4. Generate Contract Bindings

```bash
stellar contract bindings typescript \
  --contract-id game_leaderboard \
  --network testnet \
  --output-dir frontend/packages/game_leaderboard
```

### 5. Run the Frontend

```bash
# From project root
npm run dev
```

App runs at `http://localhost:5173`

---

### Run Contract Tests

```bash
cd contracts
cargo test
```

---

### CLI Invoke Example

```bash
stellar contract invoke \
  --id game_leaderboard \
  --source-account swag \
  --network testnet \
  -- \
  create_leaderboard \
  --name "Stellar Racer" \
  --creator <YOUR_ADDRESS> \
  --scoring_type '{"HighestWins":{}}' \
  --max_entries 10
```

---

## 🔗 Deployed Smart Contract

| Network | Link |
|---|---|
| Stellar Testnet | [CDPSYJQYFIVSVEWNGL47ZF5VEEDPMMVHPVLCQZKFTA3VTFKQDGJVELVA](https://stellar.expert/explorer/testnet/contract/CDPSYJQYFIVSVEWNGL47ZF5VEEDPMMVHPVLCQZKFTA3VTFKQDGJVELVA) |

---

## 🔗 Transaction Hash (Contract Call)

| Action | Transaction Hash |
|---|---|
| `submit_score` on testnet | *(run the app, submit a score, and paste the hash here from the tx badge)* |

Verify any tx at: `https://stellar.expert/explorer/testnet/tx/1dc138055d32788b2f9fc34aba9f701d7a35c30eb1b2e4c88252052ad51f8967`

---

## 🛠️ Tech Stack

- **Smart Contract:** Rust + Soroban SDK v22
- **Blockchain:** Stellar Testnet
- **CLI:** Stellar CLI
- **Storage:** Soroban Persistent + Instance storage
- **Multi-Wallet:** `@creit.tech/stellar-wallets-kit` v2 (Freighter, xBull, LOBSTR)

---

## 📄 License

MIT
