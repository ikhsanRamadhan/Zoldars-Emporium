const MERCHANT_ACCOUNT_ID = process.env.ACCOUNT_ID!;

export async function verifyPayment(
    senderAccountId: string,
    expectedAmountHbar: number,
    afterTimestamp: number
): Promise<boolean> {
    const tinybar = Math.round(expectedAmountHbar * 1e8);

    const hederaTimestamp = `${afterTimestamp}.000000000`;

    const url = `https://testnet.mirrornode.hedera.com/api/v1/transactions` +
        `?account.id=${MERCHANT_ACCOUNT_ID}` +
        `&type=credit` +
        `&timestamp=gte:${hederaTimestamp}` +
        `&limit=20`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return false;
        
        const data = await res.json();
        console.log("[Zoldar Audit] Mirror Node Data:", JSON.stringify(data));

        if (!data.transactions || data.transactions.length === 0) {
            return false;
        }

        return data.transactions.some((tx: any) => {
            if (tx.result !== "SUCCESS") return false;

            const merchantReceived = tx.transfers?.some(
                (t: any) => t.account === MERCHANT_ACCOUNT_ID && t.amount >= tinybar
            );

            const userSent = tx.transfers?.some(
                (t: any) => t.account === senderAccountId && t.amount < 0
            );

            return merchantReceived && userSent;
        });

    } catch (error) {
        console.error("Error verifying Hedera payment:", error);
        return false;
    }
}