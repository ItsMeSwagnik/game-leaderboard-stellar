import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDPSYJQYFIVSVEWNGL47ZF5VEEDPMMVHPVLCQZKFTA3VTFKQDGJVELVA",
  }
} as const

export type DataKey = {tag: "LeaderboardCount", values: void} | {tag: "Leaderboard", values: readonly [u64]} | {tag: "Scores", values: readonly [u64]};


export interface ScoreEntry {
  player: string;
  score: u64;
  timestamp: u64;
}


export interface Leaderboard {
  created_at: u64;
  creator: string;
  id: u64;
  max_entries: u32;
  name: string;
  scoring_type: ScoringType;
}


export interface RankedEntry {
  player: string;
  rank: u32;
  score: u64;
}

export type ScoringType = {tag: "HighestWins", values: void} | {tag: "LowestWins", values: void};

export interface Client {
  /**
   * Construct and simulate a submit_score transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Anyone can submit a score for any leaderboard.
   * If the player already has an entry it is replaced; otherwise appended
   * (up to max_entries — oldest entry is dropped when full).
   */
  submit_score: ({leaderboard_id, player, score}: {leaderboard_id: u64, player: string, score: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_leaderboard transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the leaderboard sorted by rank (best first).
   */
  get_leaderboard: ({leaderboard_id}: {leaderboard_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<RankedEntry>>>

  /**
   * Construct and simulate a get_player_rank transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the rank and score of a specific player, or panics if not found.
   */
  get_player_rank: ({leaderboard_id, player}: {leaderboard_id: u64, player: string}, options?: MethodOptions) => Promise<AssembledTransaction<RankedEntry>>

  /**
   * Construct and simulate a create_leaderboard transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Anyone can create a leaderboard. Returns the new leaderboard id.
   */
  create_leaderboard: ({name, creator, scoring_type, max_entries}: {name: string, creator: string, scoring_type: ScoringType, max_entries: u32}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAAEExlYWRlcmJvYXJkQ291bnQAAAABAAAAAAAAAAtMZWFkZXJib2FyZAAAAAABAAAABgAAAAEAAAAAAAAABlNjb3JlcwAAAAAAAQAAAAY=",
        "AAAAAAAAAK9BbnlvbmUgY2FuIHN1Ym1pdCBhIHNjb3JlIGZvciBhbnkgbGVhZGVyYm9hcmQuCklmIHRoZSBwbGF5ZXIgYWxyZWFkeSBoYXMgYW4gZW50cnkgaXQgaXMgcmVwbGFjZWQ7IG90aGVyd2lzZSBhcHBlbmRlZAoodXAgdG8gbWF4X2VudHJpZXMg4oCUIG9sZGVzdCBlbnRyeSBpcyBkcm9wcGVkIHdoZW4gZnVsbCkuAAAAAAxzdWJtaXRfc2NvcmUAAAADAAAAAAAAAA5sZWFkZXJib2FyZF9pZAAAAAAABgAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAVzY29yZQAAAAAAAAYAAAAA",
        "AAAAAQAAAAAAAAAAAAAAClNjb3JlRW50cnkAAAAAAAMAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAFc2NvcmUAAAAAAAAGAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAG",
        "AAAAAQAAAAAAAAAAAAAAC0xlYWRlcmJvYXJkAAAAAAYAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAACaWQAAAAAAAYAAAAAAAAAC21heF9lbnRyaWVzAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAxzY29yaW5nX3R5cGUAAAfQAAAAC1Njb3JpbmdUeXBlAA==",
        "AAAAAQAAAAAAAAAAAAAAC1JhbmtlZEVudHJ5AAAAAAMAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAEcmFuawAAAAQAAAAAAAAABXNjb3JlAAAAAAAABg==",
        "AAAAAgAAAAAAAAAAAAAAC1Njb3JpbmdUeXBlAAAAAAIAAAAAAAAAAAAAAAtIaWdoZXN0V2lucwAAAAAAAAAAAAAAAApMb3dlc3RXaW5zAAA=",
        "AAAAAAAAADRSZXR1cm5zIHRoZSBsZWFkZXJib2FyZCBzb3J0ZWQgYnkgcmFuayAoYmVzdCBmaXJzdCkuAAAAD2dldF9sZWFkZXJib2FyZAAAAAABAAAAAAAAAA5sZWFkZXJib2FyZF9pZAAAAAAABgAAAAEAAAPqAAAH0AAAAAtSYW5rZWRFbnRyeQA=",
        "AAAAAAAAAEhSZXR1cm5zIHRoZSByYW5rIGFuZCBzY29yZSBvZiBhIHNwZWNpZmljIHBsYXllciwgb3IgcGFuaWNzIGlmIG5vdCBmb3VuZC4AAAAPZ2V0X3BsYXllcl9yYW5rAAAAAAIAAAAAAAAADmxlYWRlcmJvYXJkX2lkAAAAAAAGAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAH0AAAAAtSYW5rZWRFbnRyeQA=",
        "AAAAAAAAAEBBbnlvbmUgY2FuIGNyZWF0ZSBhIGxlYWRlcmJvYXJkLiBSZXR1cm5zIHRoZSBuZXcgbGVhZGVyYm9hcmQgaWQuAAAAEmNyZWF0ZV9sZWFkZXJib2FyZAAAAAAABAAAAAAAAAAEbmFtZQAAABAAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAMc2NvcmluZ190eXBlAAAH0AAAAAtTY29yaW5nVHlwZQAAAAAAAAAAC21heF9lbnRyaWVzAAAAAAQAAAABAAAABg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    submit_score: this.txFromJSON<null>,
        get_leaderboard: this.txFromJSON<Array<RankedEntry>>,
        get_player_rank: this.txFromJSON<RankedEntry>,
        create_leaderboard: this.txFromJSON<u64>
  }
}