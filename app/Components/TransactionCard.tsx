import { TransactionResult } from "../lib/Types/Transaction";

export default function TransactionCard({ tx }: { tx: TransactionResult }) {
    const isPending = tx.status === "pending";
    const isConfirmed = tx.status === "confirmed";
    
    return (
        <div className="tx-card" data-status={tx.status}>
            <div className="tx-header">
                <span className="tx-icon">{tx.type === "payment" ? "💎" : tx.type === "nft" ? "🏷️" : "⚠️"}</span>
                <span className="tx-title">
                    {tx.type === "payment" ? "HBAR Payment" : tx.type === "nft" ? "NFT Receipt Minted" : "Transaction Failed"}
                </span>
                <span className={`tx-badge ${tx.status}`}>
                    {isPending ? "⏳ Pending" : isConfirmed ? "✓ Confirmed" : "✗ Failed"}
                </span>
            </div>
            {tx.txId && (
                <div className="tx-row">
                    <span className="tx-label">TX ID</span>
                    <code className="tx-value">{tx.txId}</code>
                </div>
            )}
            {tx.nftId && (
                <div className="tx-row">
                    <span className="tx-label">NFT Token</span>
                    <code className="tx-value">{tx.nftId}</code>
                </div>
            )}
            {tx.amount && (
                <div className="tx-row">
                    <span className="tx-label">Amount</span>
                    <span className="tx-value gold">{tx.amount} ℏ</span>
                </div>
            )}
            {tx.item && (
                <div className="tx-row">
                    <span className="tx-label">Item</span>
                    <span className="tx-value">{tx.item}</span>
                </div>
            )}
        </div>
    );
}