import { useState, useEffect, useCallback } from "react";
import { connectWallet, disconnectWallet, fetchXLMBalance, sendXLM } from "./wallet";
import { getClient } from "./contract";
import type { RankedEntry, ScoringType } from "game_leaderboard";
import "./App.css";

export default function App() {
  // ── Wallet state ──────────────────────────────────────────────────────────
  const [wallet, setWallet] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // ── Send XLM state ────────────────────────────────────────────────────────
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");

  // ── Leaderboard state ─────────────────────────────────────────────────────
  const [lbName, setLbName] = useState("Stellar Racer");
  const [scoring, setScoring] = useState<"HighestWins" | "LowestWins">("HighestWins");
  const [maxEntries, setMaxEntries] = useState(10);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [submitId, setSubmitId] = useState(0);
  const [submitScore, setSubmitScore] = useState(0);
  const [viewId, setViewId] = useState(0);
  const [rankings, setRankings] = useState<RankedEntry[]>([]);

  // ── Auto-refresh balance when wallet changes ──────────────────────────────
  const refreshBalance = useCallback(async (addr: string) => {
    try {
      const bal = await fetchXLMBalance(addr);
      setBalance(bal);
    } catch {
      setBalance("—");
    }
  }, []);

  useEffect(() => {
    if (wallet) refreshBalance(wallet);
    else setBalance("");
  }, [wallet, refreshBalance]);

  // ── Wallet handlers ───────────────────────────────────────────────────────
  async function handleConnect() {
    try {
      setStatus("Connecting...");
      const addr = await connectWallet();
      setWallet(addr);
      setStatus("");
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
  }

  function handleDisconnect() {
    disconnectWallet();
    setWallet("");
    setBalance("");
    setStatus("");
    setTxHash("");
    setTxError("");
    setRankings([]);
  }

  // ── Send XLM handler ──────────────────────────────────────────────────────
  async function handleSendXLM() {
    if (!wallet) return setStatus("Connect wallet first");
    setTxHash("");
    setTxError("");
    try {
      setStatus("Sending XLM...");
      const hash = await sendXLM(wallet, sendTo, sendAmount);
      setTxHash(hash);
      setStatus("");
      await refreshBalance(wallet);
    } catch (e: any) {
      setTxError(e.message);
      setStatus("");
    }
  }

  // ── Leaderboard handlers ──────────────────────────────────────────────────
  async function handleCreate() {
    if (!wallet) return setStatus("Connect wallet first");
    try {
      setStatus("Creating leaderboard...");
      const client = getClient(wallet);
      const scoringType: ScoringType =
        scoring === "HighestWins"
          ? { tag: "HighestWins", values: undefined }
          : { tag: "LowestWins", values: undefined };
      const tx = await client.create_leaderboard({
        name: lbName,
        creator: wallet,
        scoring_type: scoringType,
        max_entries: maxEntries,
      });
      await tx.signAndSend();
      setCreatedId(Number(tx.result));
      setStatus(`✅ Leaderboard created! ID: ${tx.result}`);
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
  }

  async function handleSubmitScore() {
    if (!wallet) return setStatus("Connect wallet first");
    try {
      setStatus("Submitting score...");
      const client = getClient(wallet);
      const tx = await client.submit_score({
        leaderboard_id: BigInt(submitId),
        player: wallet,
        score: BigInt(submitScore),
      });
      await tx.signAndSend();
      setStatus("✅ Score submitted!");
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
  }

  async function handleViewRankings() {
    try {
      setStatus("Loading rankings...");
      const client = getClient();
      const tx = await client.get_leaderboard({ leaderboard_id: BigInt(viewId) });
      setRankings(tx.result as RankedEntry[]);
      setStatus("");
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
  }

  const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  return (
    <div className="app">

      {/* ── Navbar ── */}
      <nav className="navbar">
        <span className="logo">🏆 StellarRank</span>
        <div className="nav-links">
          <a href="#wallet">Wallet</a>
          <a href="#send">Send XLM</a>
          <a href="#leaderboards">Leaderboards</a>
          <a href="#rankings">Rankings</a>
        </div>
        {wallet ? (
          <div className="wallet-info">
            <span className="wallet-addr" title={wallet}>{short(wallet)}</span>
            <span className="wallet-bal">{balance} XLM</span>
            <button className="btn-disconnect" onClick={handleDisconnect}>Disconnect</button>
          </div>
        ) : (
          <button className="btn-connect" onClick={handleConnect}>Connect Wallet</button>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <h1>Compete.<br />Climb.<br />Conquer.</h1>
        <p>A permissionless gaming leaderboard powered by Stellar.<br />
          Create games, submit scores, and prove your rank on-chain.</p>
        <div className="hero-btns">
          {!wallet
            ? <button className="btn-primary" onClick={handleConnect}>Connect Wallet</button>
            : <a href="#leaderboards" className="btn-primary">Create Leaderboard</a>
          }
          <a href="#rankings" className="btn-secondary">Explore Rankings</a>
        </div>
      </section>

      {status && <div className="status-bar">{status}</div>}

      {/* ── Wallet Panel ── */}
      <section className="card" id="wallet">
        <h2>👛 Wallet</h2>
        {wallet ? (
          <>
            <div className="info-row">
              <span className="label">Address</span>
              <span className="value mono" title={wallet}>{short(wallet)}</span>
            </div>
            <div className="info-row">
              <span className="label">Network</span>
              <span className="value">Stellar Testnet</span>
            </div>
            <div className="info-row balance-row">
              <span className="label">XLM Balance</span>
              <span className="value balance">{balance !== "" ? `${balance} XLM` : "Loading..."}</span>
            </div>
            <div className="row">
              <button className="btn-secondary" onClick={() => refreshBalance(wallet)}>↻ Refresh Balance</button>
              <button className="btn-disconnect" onClick={handleDisconnect}>Disconnect</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Connect your Freighter wallet to get started.</p>
            <button className="btn-primary" onClick={handleConnect}>Connect Wallet</button>
          </>
        )}
      </section>

      {/* ── Send XLM ── */}
      <section className="card" id="send">
        <h2>💸 Send XLM</h2>
        <input
          value={sendTo}
          onChange={e => setSendTo(e.target.value)}
          placeholder="Destination address (G...)"
        />
        <input
          type="number"
          value={sendAmount}
          onChange={e => setSendAmount(e.target.value)}
          placeholder="Amount (XLM)"
          min="0.0000001"
          step="0.1"
        />
        <button className="btn-primary" onClick={handleSendXLM} disabled={!wallet}>
          Send XLM
        </button>
        {txHash && (
          <div className="tx-success">
            ✅ Transaction sent!<br />
            Hash: <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="tx-link"
            >{txHash.slice(0, 16)}...{txHash.slice(-8)}</a>
          </div>
        )}
        {txError && <div className="tx-error">❌ {txError}</div>}
      </section>

      {/* ── Create Leaderboard ── */}
      <section className="card" id="leaderboards">
        <h2>🎮 Create Leaderboard</h2>
        <input value={lbName} onChange={e => setLbName(e.target.value)} placeholder="Game name" />
        <select value={scoring} onChange={e => setScoring(e.target.value as any)}>
          <option value="HighestWins">Highest Wins (arcade)</option>
          <option value="LowestWins">Lowest Wins (speedrun)</option>
        </select>
        <input
          type="number" value={maxEntries} min={1} max={100}
          onChange={e => setMaxEntries(Number(e.target.value))}
          placeholder="Max entries"
        />
        <button className="btn-primary" onClick={handleCreate} disabled={!wallet}>Create</button>
        {createdId !== null && <p className="result">✅ Leaderboard ID: <strong>{createdId}</strong></p>}
      </section>

      {/* ── Submit Score ── */}
      <section className="card" id="submit">
        <h2>📊 Submit Score</h2>
        <input
          type="number" value={submitId}
          onChange={e => setSubmitId(Number(e.target.value))}
          placeholder="Leaderboard ID"
        />
        <input
          type="number" value={submitScore}
          onChange={e => setSubmitScore(Number(e.target.value))}
          placeholder="Your score"
        />
        <button className="btn-primary" onClick={handleSubmitScore} disabled={!wallet}>Submit</button>
      </section>

      {/* ── View Rankings ── */}
      <section className="card" id="rankings">
        <h2>🏅 View Rankings</h2>
        <div className="row">
          <input
            type="number" value={viewId}
            onChange={e => setViewId(Number(e.target.value))}
            placeholder="Leaderboard ID"
          />
          <button className="btn-secondary" onClick={handleViewRankings}>Load</button>
        </div>
        {rankings.length > 0 && (
          <table>
            <thead>
              <tr><th>Rank</th><th>Player</th><th>Score</th></tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={i} className={r.player === wallet ? "highlight" : ""}>
                  <td>#{r.rank}</td>
                  <td title={r.player}>{short(r.player)}</td>
                  <td>{r.score.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer>
        <p>
          Contract:{" "}
          <a
            href="https://stellar.expert/explorer/testnet/contract/CDPSYJQYFIVSVEWNGL47ZF5VEEDPMMVHPVLCQZKFTA3VTFKQDGJVELVA"
            target="_blank" rel="noreferrer"
          >
            CDPSYJQ...VELVA
          </a>
        </p>
      </footer>
    </div>
  );
}
