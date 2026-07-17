import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CDPSYJQYFIVSVEWNGL47ZF5VEEDPMMVHPVLCQZKFTA3VTFKQDGJVELVA";
    };
};
export type DataKey = {
    tag: "LeaderboardCount";
    values: void;
} | {
    tag: "Leaderboard";
    values: readonly [u64];
} | {
    tag: "Scores";
    values: readonly [u64];
};
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
export type ScoringType = {
    tag: "HighestWins";
    values: void;
} | {
    tag: "LowestWins";
    values: void;
};
export interface Client {
    /**
     * Construct and simulate a submit_score transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Anyone can submit a score for any leaderboard.
     * If the player already has an entry it is replaced; otherwise appended
     * (up to max_entries — oldest entry is dropped when full).
     */
    submit_score: ({ leaderboard_id, player, score }: {
        leaderboard_id: u64;
        player: string;
        score: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_leaderboard transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Returns the leaderboard sorted by rank (best first).
     */
    get_leaderboard: ({ leaderboard_id }: {
        leaderboard_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<RankedEntry>>>;
    /**
     * Construct and simulate a get_player_rank transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Returns the rank and score of a specific player, or panics if not found.
     */
    get_player_rank: ({ leaderboard_id, player }: {
        leaderboard_id: u64;
        player: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<RankedEntry>>;
    /**
     * Construct and simulate a create_leaderboard transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Anyone can create a leaderboard. Returns the new leaderboard id.
     */
    create_leaderboard: ({ name, creator, scoring_type, max_entries }: {
        name: string;
        creator: string;
        scoring_type: ScoringType;
        max_entries: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        submit_score: (json: string) => AssembledTransaction<null>;
        get_leaderboard: (json: string) => AssembledTransaction<RankedEntry[]>;
        get_player_rank: (json: string) => AssembledTransaction<RankedEntry>;
        create_leaderboard: (json: string) => AssembledTransaction<bigint>;
    };
}
