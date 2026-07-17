import {
  isConnected,
  setAllowed,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import {
  Horizon,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org:443";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (!connected) throw new Error("Freighter extension not found. Please install it.");
  await setAllowed();
  const { address, error } = await getAddress();
  if (error || !address) throw new Error(error ?? "Failed to get address");
  return address;
}

export function disconnectWallet(): void {
  // Freighter has no programmatic disconnect — we clear local state only
}

export async function fetchXLMBalance(address: string): Promise<string> {
  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(address);
  const xlm = account.balances.find((b) => b.asset_type === "native");
  return xlm ? parseFloat(xlm.balance).toFixed(2) : "0.00";
}

export async function sendXLM(
  from: string,
  to: string,
  amount: string
): Promise<string> {
  const server = new Horizon.Server(HORIZON_URL);
  const sourceAccount = await server.loadAccount(from);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: to,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .build();

  const { signedTxXdr, error } = await signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: from,
  });
  if (error || !signedTxXdr) throw new Error(error ?? "Signing failed");

  const result = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET)
  );
  return result.hash;
}

export async function sign(xdr: string, address: string): Promise<{ signedTxXdr: string }> {
  const { signedTxXdr, error } = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });
  if (error || !signedTxXdr) throw new Error(error ?? "Signing failed");
  return { signedTxXdr };
}
