import Image from "next/image";
import { InventoryItem } from "@/app/lib/Types/InventoryItems";

const RARITY_CONFIG: Record<string, {
    label: string;
    color: string;
    glow: string;
    border: string;
    bg: string;
    shimmer: string;
}> = {
    legendary: {
        label: "Legendary",
        color: "text-[#ff9a00]",
        glow: "shadow-[0_0_24px_rgba(255,154,0,0.3)]",
        border: "border-[rgba(255,154,0,0.4)]",
        bg: "from-[#231500] via-[#1a1005] to-[#0f0a00]",
        shimmer: "from-[rgba(255,154,0,0)] via-[rgba(255,154,0,0.06)] to-[rgba(255,154,0,0)]",
    },
    epic: {
        label: "Epic",
        color: "text-[#c084fc]",
        glow: "shadow-[0_0_24px_rgba(192,132,252,0.25)]",
        border: "border-[rgba(192,132,252,0.35)]",
        bg: "from-[#180d2a] via-[#120a1e] to-[#0c0814]",
        shimmer: "from-[rgba(192,132,252,0)] via-[rgba(192,132,252,0.06)] to-[rgba(192,132,252,0)]",
    },
    rare: {
        label: "Rare",
        color: "text-[#60a5fa]",
        glow: "shadow-[0_0_24px_rgba(96,165,250,0.25)]",
        border: "border-[rgba(96,165,250,0.35)]",
        bg: "from-[#091428] via-[#070f1e] to-[#050b14]",
        shimmer: "from-[rgba(96,165,250,0)] via-[rgba(96,165,250,0.06)] to-[rgba(96,165,250,0)]",
    },
    uncommon: {
        label: "Uncommon",
        color: "text-[#4ade80]",
        glow: "shadow-[0_0_18px_rgba(74,222,128,0.2)]",
        border: "border-[rgba(74,222,128,0.3)]",
        bg: "from-[#081a0d] via-[#061309] to-[#040d06]",
        shimmer: "from-[rgba(74,222,128,0)] via-[rgba(74,222,128,0.05)] to-[rgba(74,222,128,0)]",
    },
    common: {
        label: "Common",
        color: "text-[#9ca3af]",
        glow: "shadow-[0_0_12px_rgba(156,163,175,0.1)]",
        border: "border-[rgba(156,163,175,0.2)]",
        bg: "from-[#141414] via-[#0f0f0f] to-[#0a0a0a]",
        shimmer: "from-[rgba(156,163,175,0)] via-[rgba(156,163,175,0.04)] to-[rgba(156,163,175,0)]",
    },
};

const CATEGORY_ICON: Record<string, string> = {
    weapon: "⚔️", potion: "🧪", armor: "🛡️",
    ring: "💍", staff: "🪄", scroll: "📜", amulet: "🔮",
};

type Props = { item: InventoryItem };

export default function InventoryCard({ item }: Props) {
    const rarityKey = item.rarity?.toLowerCase() ?? "common";
    const rarity = RARITY_CONFIG[rarityKey] ?? RARITY_CONFIG.common;
    const categoryIcon = CATEGORY_ICON[item.category?.toLowerCase() ?? ""] ?? "🗡️";

    return (
        <div className={`
            group relative overflow-hidden rounded-2xl border bg-linear-to-b
            ${rarity.border} ${rarity.glow} ${rarity.bg}
            transition-all duration-300 hover:scale-[1.025] hover:brightness-110
            cursor-default select-none
        `}>
            {/* Shimmer overlay */}
            <div className={`pointer-events-none absolute inset-0 z-10 bg-linear-to-r ${rarity.shimmer} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Image */}
            <div className="relative h-32 w-full overflow-hidden">
                <Image
                    src={item.image ?? "/placeholder.png"}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />

                {/* Owned badge — top left */}
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                    <span className="font-cinzel text-[10px] font-bold tracking-widest text-[#d4a843]">x{item.owned}</span>
                </div>

                {/* Category icon — bottom left */}
                <span className="absolute bottom-2 left-2.5 text-base drop-shadow-lg">{categoryIcon}</span>
            </div>

            {/* Content */}
            <div className="px-3 pb-3 pt-2.5">
                {/* Rarity pill */}
                <div className={`mb-2 inline-flex items-center rounded-full border px-2 py-0.5 ${rarity.border} bg-black/30`}>
                    <span className={`font-cinzel text-[9px] font-bold uppercase tracking-[0.15em] ${rarity.color}`}>
                        {rarity.label}
                    </span>
                </div>

                {/* Name */}
                <h3 className={`font-cinzel text-[12px] font-bold leading-tight tracking-wide ${rarity.color} line-clamp-1`}>
                    {item.name}
                </h3>

                {/* Thin divider */}
                <div className={`my-2 h-px w-full bg-linear-to-r from-transparent via-current to-transparent opacity-20 ${rarity.color}`} />

                {/* Description */}
                <p className="line-clamp-2 text-[11px] leading-relaxed italic text-[#7a6a55]">
                    {item.description ?? "A mysterious item from the merchant's vault."}
                </p>

                {/* Price */}
                <div className="mt-2.5 flex items-center gap-1">
                    <span className="text-sm text-[#d4a843]">⬡</span>
                    <span className="font-cinzel text-[13px] font-bold text-[#d4a843]">{item.price}</span>
                    <span className="font-mono text-[10px] tracking-widest text-[#6a5030]">HBAR</span>
                </div>
            </div>
        </div>
    );
}