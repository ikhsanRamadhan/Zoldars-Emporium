import { ITEMS } from "@/app/lib/Items/Index";

export type InventoryItem = {
    itemId: string;
    name: string;
    rarity: string;
    description: string;
    category: string;
    image: string;
    price: number;
    owned: number;
};

export const INVENTORY: InventoryItem[] = ITEMS.map((item) => ({
    itemId: item.id,
    name: item.name,
    rarity: item.rarity,
    description: item.description,
    category: item.category,
    image: item.image,
    price: item.price,
    owned: 0, //
}));