import { useState, useEffect, useCallback, useRef } from "react";
import {
  connectWallet,
  disconnectWallet,
  fetchXLMBalance,
  sendXLM,
  WalletNotFoundError,
  WalletRejectedError,
  InsufficientBalanceError,
} from "./wallet";
import { getClient } from "./contract";
import type { RankedEntry, ScoringType } from "game_leaderboard";
import "./App.css";

type TxStatus = "idle" | "pending" | "success" | "fail";

function TxBadge({ status, hash }: { status: TxStatus; hash?: string }) {
  if (status === "idle") return null;
  const labels: Record<TxStatus, string> = {
    idle: "",
    pending: "⏳ Transaction pending…",
    success: "✅ Transaction confirmed!",
    fail: "❌ Transaction failed",
  };
  return (
    <div className={`tx-badge tx-badge--${status}`}>
      {labels[status]}
      {status === "success" && hash && (
        <>
          {" "}
          Hash:{" "}
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="tx-link"
          >
            {hash.slice(0, 12)}…{hash.slice(-8)}
          </a>
        </>
      )}
    </div>
  );
}

function formatError(e: any): string {
  if (e instanceof WalletNotFoundError) return `🔌 ${e.message}`;
  if (e instanceof WalletRejectedError) return `🚫 ${e.message}`;
  if (e instanceof InsufficientBalanceError) return `💸 ${e.message}`;
  return `❌ ${e?.message ?? "Unknown error"}`;
}

export default function App() {
  // ── Wallet state ──────────────────────────────────────────────────────────
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("");

  // ── Send XLM state ────────────────────────────────────────────────────────
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendTxStatus, setSendTxStatus] = useState<TxStatus>("idle");
  const [sendTxHash, setSendTxHash] = useState("");

  // ── Leaderboard state ─────────────────────────────────────────────────────
  const [lbName, setLbName] = useState("Stellar Racer");
  const [scoring, setScoring] = useState<"HighestWins" | "LowestWins">("HighestWins");
  const [maxEntries, setMaxEntries] = useState(10);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [createTxStatus, setCreateTxStatus] = useState<TxStatus>("idle");
  const [createTxHash, setCreateTxHash] = useState("");

  const [submitId, setSubmitId] = useState(0);
  const [submitScore, setSubmitScore] = useState(0);
  const [submitTxStatus, setSubmitTxStatus] = useState<TxStatus>("idle");
  const [submitTxHash, setSubmitTxHash] = useState("");

  const [viewId, setViewId] = useState(0);
  const [rankings, setRankings] = useState<RankedEntry[]>([]);
  const [livePolling, setLivePolling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshBalance = useCallback(async (addr: string) => {
    try {
      setBalance(await fetchXLMBalance(addr));
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
      setStatus("Opening wallet picker…");
      const addr = await connectWallet();
      setWallet(addr);
      setStatus("");
    } catch (e: any) {
      setStatus(formatError(e));
    }
  }

  async function handleDisconnect() {
    await disconnectWallet();
    setWallet("");
    setBalance("");
    setStatus("");
    setSendTxStatus("idle");
    setSendTxHash("");
    setCreateTxStatus("idle");
    setCreateTxHash("");
    setSubmitTxStatus("idle");
    setSubmitTxHash("");
    setRankings([]);
  }

  // ── Send XLM ──────────────────────────────────────────────────────────────
  async function handleSendXLM() {
    if (!wallet) return setStatus("Connect wallet first");
    setSendTxStatus("pending");
    setSendTxHash("");
    try {
      const hash = await sendXLM(wallet, sendTo, sendAmount);
      setSendTxHash(hash);
      setSendTxStatus("success");
      await refreshBalance(wallet);
    } catch (e: any) {
      setSendTxStatus("fail");
      setStatus(formatError(e));
    }
  }

  // ── Create Leaderboard ────────────────────────────────────────────────────
  async function handleCreate() {
    if (!wallet) return setStatus("Connect wallet first");
    setCreateTxStatus("pending");
    setCreateTxHash("");
    try {
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
      const result = await tx.signAndSend();
      setCreatedId(Number(tx.result));
      setCreateTxHash((result as any)?.hash ?? "");
      setCreateTxStatus("success");
      setStatus("");
    } catch (e: any) {
      setCreateTxStatus("fail");
      setStatus(formatError(e));
    }
  }

  // ── Submit Score ──────────────────────────────────────────────────────────
  async function handleSubmitScore() {
    if (!wallet) return setStatus("Connect wallet first");
    setSubmitTxStatus("pending");
    setSubmitTxHash("");
    try {
      const client = getClient(wallet);
      const tx = await client.submit_score({
        leaderboard_id: BigInt(submitId),
        player: wallet,
        score: BigInt(submitScore),
      });
      const result = await tx.signAndSend();
      setSubmitTxHash((result as any)?.hash ?? "");
      setSubmitTxStatus("success");
      setStatus("");
    } catch (e: any) {
      setSubmitTxStatus("fail");
      setStatus(formatError(e));
    }
  }

  // ── View Rankings ─────────────────────────────────────────────────────────
  const fetchRankings = useCallback(async (id: number, silent = false) => {
    try {
      if (!silent) setStatus("Loading rankings…");
      const client = getClient();
      const tx = await client.get_leaderboard({ leaderboard_id: BigInt(id) });
      setRankings(tx.result as RankedEntry[]);
      if (!silent) setStatus("");
    } catch (e: any) {
      if (!silent) setStatus(formatError(e));
    }
  }, []);

  async function handleViewRankings() {
    await fetchRankings(viewId);
  }

  function toggleLivePolling() {
    if (livePolling) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      setLivePolling(false);
    } else {
      fetchRankings(viewId, true);
      pollingRef.current = setInterval(() => fetchRankings(viewId, true), 5000);
      setLivePolling(true);
    }
  }

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

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
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <a href="#wallet" onClick={() => setMenuOpen(false)}>Wallet</a>
        <a href="#send" onClick={() => setMenuOpen(false)}>Send XLM</a>
        <a href="#leaderboards" onClick={() => setMenuOpen(false)}>Leaderboards</a>
        <a href="#rankings" onClick={() => setMenuOpen(false)}>Rankings</a>
      </div>

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
            <p className="muted">Connect via Freighter, xBull, or LOBSTR.</p>
            <button className="btn-primary" onClick={handleConnect}>Connect Wallet</button>
          </>
        )}
      </section>

      {/* ── Send XLM ── */}
      <section className="card" id="send">
        <h2>💸 Send XLM</h2>
        <input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="Destination address (G...)" />
        <input
          type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)}
          placeholder="Amount (XLM)" min="0.0000001" step="0.1"
        />
        <button className="btn-primary" onClick={handleSendXLM} disabled={!wallet || sendTxStatus === "pending"}>
          {sendTxStatus === "pending" ? "Sending…" : "Send XLM"}
        </button>
        <TxBadge status={sendTxStatus} hash={sendTxHash} />
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
        <button className="btn-primary" onClick={handleCreate} disabled={!wallet || createTxStatus === "pending"}>
          {createTxStatus === "pending" ? "Creating…" : "Create"}
        </button>
        <TxBadge status={createTxStatus} hash={createTxHash} />
        {createdId !== null && createTxStatus === "success" && (
          <p className="result">Leaderboard ID: <strong>{createdId}</strong></p>
        )}
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
        <button className="btn-primary" onClick={handleSubmitScore} disabled={!wallet || submitTxStatus === "pending"}>
          {submitTxStatus === "pending" ? "Submitting…" : "Submit"}
        </button>
        <TxBadge status={submitTxStatus} hash={submitTxHash} />
      </section>

      {/* ── View Rankings ── */}
      <section className="card" id="rankings">
        <h2>
          🏅 View Rankings
          {livePolling && (
            <span className="live-badge">
              <span className="live-dot" /> LIVE
            </span>
          )}
        </h2>
        <div className="row">
          <input
            type="number" value={viewId}
            onChange={e => { setViewId(Number(e.target.value)); if (livePolling) { if (pollingRef.current) clearInterval(pollingRef.current); setLivePolling(false); } }}
            placeholder="Leaderboard ID"
          />
          <button className="btn-secondary" onClick={handleViewRankings}>Load</button>
          <button className="btn-secondary" onClick={toggleLivePolling}>
            {livePolling ? "⏹ Stop" : "▶ Live"}
          </button>
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
