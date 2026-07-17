import { Client, networks } from "game_leaderboard";
import { RPC_URL, NETWORK_PASSPHRASE, sign } from "./wallet";

export function getClient(walletAddress?: string) {
  return new Client({
    ...networks.testnet,
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    ...(walletAddress && {
      publicKey: walletAddress,
      signTransaction: (xdr: string) => sign(xdr, walletAddress),
    }),
  });
}
