import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import {
  Horizon,
  TransactionBuilder,
  Networks as StellarNetworks,
  BASE_FEE,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org:443";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

// ── Error types ───────────────────────────────────────────────────────────────
export class WalletNotFoundError extends Error {
  constructor(msg = "No wallet extension found. Please install Freighter, xBull, or LOBSTR.") {
    super(msg);
    this.name = "WalletNotFoundError";
  }
}

export class WalletRejectedError extends Error {
  constructor(msg = "Transaction rejected by user.") {
    super(msg);
    this.name = "WalletRejectedError";
  }
}

export class InsufficientBalanceError extends Error {
  constructor(msg = "Insufficient XLM balance to complete this transaction.") {
    super(msg);
    this.name = "InsufficientBalanceError";
  }
}

// ── Kit initialisation (once) ─────────────────────────────────────────────────
StellarWalletsKit.init({
  modules: [new FreighterModule(), new xBullModule(), new LobstrModule()],
  network: Networks.TESTNET,
});

function classifyError(e: any): never {
  const msg: string = e?.message ?? "";
  if (
    msg.toLowerCase().includes("reject") ||
    msg.toLowerCase().includes("cancel") ||
    msg.toLowerCase().includes("denied") ||
    msg.toLowerCase().includes("closed")
  ) {
    throw new WalletRejectedError();
  }
  throw e;
}

export async function connectWallet(): Promise<string> {
  const wallets = await StellarWalletsKit.refreshSupportedWallets().catch(() => []);
  if (!wallets.some((w) => w.isAvailable)) throw new WalletNotFoundError();

  try {
    const { address } = await StellarWalletsKit.authModal();
    if (!address) throw new WalletRejectedError();
    return address;
  } catch (e: any) {
    if (e instanceof WalletNotFoundError || e instanceof WalletRejectedError) throw e;
    classifyError(e);
  }
}

export async function disconnectWallet(): Promise<void> {
  await StellarWalletsKit.disconnect().catch(() => {});
}

export async function fetchXLMBalance(address: string): Promise<string> {
  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(address);
  const xlm = account.balances.find((b) => b.asset_type === "native");
  return xlm ? parseFloat(xlm.balance).toFixed(2) : "0.00";
}

export async function sendXLM(from: string, to: string, amount: string): Promise<string> {
  const server = new Horizon.Server(HORIZON_URL);
  const sourceAccount = await server.loadAccount(from).catch(() => {
    throw new WalletNotFoundError("Could not load account. Make sure it is funded on testnet.");
  });

  const xlmBalance = sourceAccount.balances.find((b) => b.asset_type === "native");
  if (!xlmBalance || parseFloat(xlmBalance.balance) < parseFloat(amount) + 0.5) {
    throw new InsufficientBalanceError();
  }

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: StellarNetworks.TESTNET,
  })
    .addOperation(Operation.payment({ destination: to, asset: Asset.native(), amount }))
    .setTimeout(30)
    .build();

  let signedTxXdr: string;
  try {
    const result = await StellarWalletsKit.signTransaction(tx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: from,
    });
    signedTxXdr = result.signedTxXdr;
  } catch (e: any) {
    if (e instanceof WalletRejectedError) throw e;
    classifyError(e);
  }

  const submitted = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedTxXdr!, StellarNetworks.TESTNET)
  );
  return submitted.hash;
}

export async function sign(xdr: string, address: string): Promise<{ signedTxXdr: string }> {
  try {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address,
    });
    return { signedTxXdr };
  } catch (e: any) {
    if (e instanceof WalletRejectedError) throw e;
    classifyError(e);
  }
}
