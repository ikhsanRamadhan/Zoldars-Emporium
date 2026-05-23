import { Item } from "../Items/Index";
import { InventoryItem } from "./InventoryItems";
import { TransactionResult } from "./Transaction";

type MessageRole = "user" | "merchant" | "system";

export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    transaction?: TransactionResult;
    itemOffered?: Item;
    inventory?: InventoryItem[];
    action?: string;
    negotiatedPrice?: number;
    mintSuccess?: {
        item: Item;
        serialNumber: number;
        transactionId: string;
        hashscanUrl: string;
    };
}