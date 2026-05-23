export interface TransactionResult {
    type: "payment" | "nft" | "error";
    txId?: string;
    nftId?: string;
    amount?: number;
    item?: string;
    status: "pending" | "confirmed" | "failed";
}