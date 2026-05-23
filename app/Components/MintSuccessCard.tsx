import { Item } from "@/app/lib/Items/Index";

interface MintSuccessCardProps {
    item: Item;
    serialNumber: number;
    transactionId: string;
    hashscanUrl: string;
}

export default function MintSuccessCard({ item, serialNumber, transactionId, hashscanUrl }: MintSuccessCardProps) {
    const shortTxId = `${transactionId.slice(0, 16)}...`;

    return (
        <div className="mt-3 rounded-2xl border border-[rgba(180,130,40,0.4)] bg-[rgba(40,25,8,0.9)] overflow-hidden shadow-[0_0_30px_rgba(180,130,40,0.15)]">
            {/* Header */}
            <div className="bg-[rgba(180,130,40,0.15)] px-4 py-2.5 flex items-center gap-2 border-b border-[rgba(180,130,40,0.2)]">
                <span className="text-lg">✨</span>
                <span className="font-cinzel text-xs font-semibold tracking-widest text-[#d4a843]">NFT ACQUIRED</span>
                <span className="ml-auto font-mono text-[10px] text-[#8a7560]">Serial #{serialNumber}</span>
            </div>

            {/* Item Info */}
            <div className="flex items-center gap-3 px-4 py-3">
                {item.image && (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl border border-[rgba(180,130,40,0.3)] object-cover shrink-0"
                    />
                )}
                <div className="flex flex-col gap-0.5">
                    <div className="font-cinzel text-sm font-semibold text-[#d4a843]">{item.name}</div>
                    <div className="text-xs text-[#8a7560] italic">{item.rarity} · {item.category}</div>
                    <div className="text-xs text-[#b8c8a0] mt-0.5">{item.description}</div>
                </div>
            </div>

            {/* Transaction Info */}
            <div className="border-t border-[rgba(180,130,40,0.15)] px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[10px] text-[#5a4a35] tracking-wider">TRANSACTION</span>
                    <span className="font-mono text-[11px] text-[#8a7560]">{shortTxId}</span>
                </div>
                <a
                    href={hashscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-[rgba(180,130,40,0.4)] bg-[rgba(180,130,40,0.1)] px-3 py-1.5 font-mono text-[11px] text-[#d4a843] transition-all hover:bg-[rgba(180,130,40,0.22)] hover:shadow-[0_0_12px_rgba(180,130,40,0.2)] shrink-0"
                >
                    <span>⬡</span>
                    <span>View on HashScan</span>
                </a>
            </div>
        </div>
    );
}