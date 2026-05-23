"use server";

const adminId = process.env.ACCOUNT_ID!;
const privateKey = process.env.PRIVATE_KEY!;

export async function generateFrozenTransaction(userAccountIdStr: string, amountHbar: number) {
    try {
        if (!adminId || !privateKey) {
            throw new Error("Server configuration missing: ACCOUNT_ID or PRIVATE_KEY.");
        }

        const { Client, AccountId, Hbar, TransferTransaction, TransactionId } = await import("@hashgraph/sdk");

        const client = Client.forTestnet();
        client.setOperator(adminId, privateKey);

        const adminAccountId = AccountId.fromString(adminId);
        const userAccountId = AccountId.fromString(userAccountIdStr);
        const priceInHbar = new Hbar(amountHbar);

        const transaction = new TransferTransaction()
            .addHbarTransfer(userAccountId, priceInHbar.negated())
            .addHbarTransfer(adminAccountId, priceInHbar)
            .setTransactionId(TransactionId.generate(userAccountId))
            .freezeWith(client);

        const transactionBytes = transaction.toBytes();
        const transactionBuffer = Buffer.from(transactionBytes).toString("base64");

        return {
            success: true,
            transactionBytesB64: transactionBuffer
        };
    } catch (error: any) {
        console.error("Gagal generate transaksi di server:", error);
        return { success: false, error: error.message || "Internal server error" };
    }
}