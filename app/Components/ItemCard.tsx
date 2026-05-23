import Image from "next/image";
import { Item } from "../lib/Items/Index";

const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string; border: string; bg: string }> = {
    legendary: {
        label: "Legendary",
        color: "text-[#ff9a00]",
        glow: "shadow-[0_0_20px_rgba(255,154,0,0.35)]",
        border: "border-[rgba(255,154,0,0.45)]",
        bg: "from-[#2a1800] to-[#1a1005]",
    },
    epic: {
        label: "Epic",
        color: "text-[#c084fc]",
        glow: "shadow-[0_0_20px_rgba(192,132,252,0.3)]",
        border: "border-[rgba(192,132,252,0.4)]",
        bg: "from-[#1a0d2e] to-[#0f0a1a]",
    },
    rare: {
        label: "Rare",
        color: "text-[#60a5fa]",
        glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]",
        border: "border-[rgba(96,165,250,0.4)]",
        bg: "from-[#0a1628] to-[#080f1e]",
    },
    uncommon: {
        label: "Uncommon",
        color: "text-[#4ade80]",
        glow: "shadow-[0_0_20px_rgba(74,222,128,0.25)]",
        border: "border-[rgba(74,222,128,0.35)]",
        bg: "from-[#0a1f0f] to-[#080f0a]",
    },
    common: {
        label: "Common",
        color: "text-[#9ca3af]",
        glow: "shadow-[0_0_12px_rgba(156,163,175,0.15)]",
        border: "border-[rgba(156,163,175,0.25)]",
        bg: "from-[#161616] to-[#0f0f0f]",
    },
};

const CATEGORY_ICON: Record<string, string> = {
    weapon: "⚔️",
    potion: "🧪",
    armor: "🛡️",
    ring: "💍",
    staff: "🪄",
    scroll: "📜",
    amulet: "🔮",
};

type Props = { item: Item; negotiatedPrice?: number; };

export default function ItemCard({ item, negotiatedPrice }: Props) {
    const displayPrice = negotiatedPrice ?? item.price;
    const rarityKey = item.rarity?.toLowerCase() ?? "common";
    const rarity = RARITY_CONFIG[rarityKey] ?? RARITY_CONFIG.common;
    const categoryIcon = CATEGORY_ICON[item.category?.toLowerCase()] ?? "🗡️";

    return (
        <div
            className={`
                mt-3 w-full max-w-xs overflow-hidden rounded-2xl border bg-linear-to-b
                ${rarity.border} ${rarity.glow} ${rarity.bg}
                transition-all duration-300 hover:scale-[1.02]
            `}
        >
            {/* Image with overlay gradient */}
            <div className="relative h-44 w-full overflow-hidden">
                <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                />
                {/* Bottom fade */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />

                {/* Rarity badge — top right */}
                <div className={`absolute right-2.5 top-2.5 rounded-full border px-2.5 py-0.5 font-cinzel text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm bg-black/40 ${rarity.color} ${rarity.border}`}>
                    {rarity.label}
                </div>

                {/* Category icon — bottom left */}
                <div className="absolute bottom-2.5 left-3 text-xl drop-shadow-lg">
                    {categoryIcon}
                </div>

                {/* Stock indicator — bottom right */}
                {item.stock !== undefined && (
                    <div className={`absolute bottom-2.5 right-3 font-mono text-[10px] tracking-widest ${item.stock > 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                        {item.stock > 0 ? `${item.stock} in stock` : "SOLD OUT"}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-4 pt-3">
                {/* Item name + category */}
                <div className="flex items-start justify-between gap-2">
                    <h2 className={`font-cinzel text-sm font-bold leading-tight tracking-wide ${rarity.color}`}>
                        {item.name}
                    </h2>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#5a4a35] mt-0.5">
                        {item.category}
                    </span>
                </div>

                {/* Divider */}
                <div className={`my-2.5 h-px w-full opacity-30 bg-linear-to-r from-transparent via-current to-transparent ${rarity.color}`} />

                {/* Description */}
                <p className="text-[12px] leading-relaxed text-[#9a8a70] italic">
                    {item.description}
                </p>

                {/* Price */}
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-base">⬡</span>
                        <span className="font-cinzel text-base font-bold text-[#d4a843]">
                            {displayPrice}
                        </span>
                        <span className="font-mono text-[11px] text-[#7a6040] tracking-widest">HBAR</span>
                    </div>
                </div>
            </div>
        </div>
    );
}