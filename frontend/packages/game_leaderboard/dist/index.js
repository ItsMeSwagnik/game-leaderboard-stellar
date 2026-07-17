import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAAEExlYWRlcmJvYXJkQ291bnQAAAABAAAAAAAAAAtMZWFkZXJib2FyZAAAAAABAAAABgAAAAEAAAAAAAAABlNjb3JlcwAAAAAAAQAAAAY=",
            "AAAAAAAAAK9BbnlvbmUgY2FuIHN1Ym1pdCBhIHNjb3JlIGZvciBhbnkgbGVhZGVyYm9hcmQuCklmIHRoZSBwbGF5ZXIgYWxyZWFkeSBoYXMgYW4gZW50cnkgaXQgaXMgcmVwbGFjZWQ7IG90aGVyd2lzZSBhcHBlbmRlZAoodXAgdG8gbWF4X2VudHJpZXMg4oCUIG9sZGVzdCBlbnRyeSBpcyBkcm9wcGVkIHdoZW4gZnVsbCkuAAAAAAxzdWJtaXRfc2NvcmUAAAADAAAAAAAAAA5sZWFkZXJib2FyZF9pZAAAAAAABgAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAVzY29yZQAAAAAAAAYAAAAA",
            "AAAAAQAAAAAAAAAAAAAAClNjb3JlRW50cnkAAAAAAAMAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAFc2NvcmUAAAAAAAAGAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAG",
            "AAAAAQAAAAAAAAAAAAAAC0xlYWRlcmJvYXJkAAAAAAYAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAACaWQAAAAAAAYAAAAAAAAAC21heF9lbnRyaWVzAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAxzY29yaW5nX3R5cGUAAAfQAAAAC1Njb3JpbmdUeXBlAA==",
            "AAAAAQAAAAAAAAAAAAAAC1JhbmtlZEVudHJ5AAAAAAMAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAEcmFuawAAAAQAAAAAAAAABXNjb3JlAAAAAAAABg==",
            "AAAAAgAAAAAAAAAAAAAAC1Njb3JpbmdUeXBlAAAAAAIAAAAAAAAAAAAAAAtIaWdoZXN0V2lucwAAAAAAAAAAAAAAAApMb3dlc3RXaW5zAAA=",
            "AAAAAAAAADRSZXR1cm5zIHRoZSBsZWFkZXJib2FyZCBzb3J0ZWQgYnkgcmFuayAoYmVzdCBmaXJzdCkuAAAAD2dldF9sZWFkZXJib2FyZAAAAAABAAAAAAAAAA5sZWFkZXJib2FyZF9pZAAAAAAABgAAAAEAAAPqAAAH0AAAAAtSYW5rZWRFbnRyeQA=",
            "AAAAAAAAAEhSZXR1cm5zIHRoZSByYW5rIGFuZCBzY29yZSBvZiBhIHNwZWNpZmljIHBsYXllciwgb3IgcGFuaWNzIGlmIG5vdCBmb3VuZC4AAAAPZ2V0X3BsYXllcl9yYW5rAAAAAAIAAAAAAAAADmxlYWRlcmJvYXJkX2lkAAAAAAAGAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAH0AAAAAtSYW5rZWRFbnRyeQA=",
            "AAAAAAAAAEBBbnlvbmUgY2FuIGNyZWF0ZSBhIGxlYWRlcmJvYXJkLiBSZXR1cm5zIHRoZSBuZXcgbGVhZGVyYm9hcmQgaWQuAAAAEmNyZWF0ZV9sZWFkZXJib2FyZAAAAAAABAAAAAAAAAAEbmFtZQAAABAAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAMc2NvcmluZ190eXBlAAAH0AAAAAtTY29yaW5nVHlwZQAAAAAAAAAAC21heF9lbnRyaWVzAAAAAAQAAAABAAAABg=="]), options);
        this.options = options;
    }
    fromJSON = {
        submit_score: (this.txFromJSON),
        get_leaderboard: (this.txFromJSON),
        get_player_rank: (this.txFromJSON),
        create_leaderboard: (this.txFromJSON)
    };
}
