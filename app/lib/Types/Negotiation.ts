import { Item } from "@/app/lib/Items/Index";

export type NegotiationState = {
    item: Item;
    originalPrice: number;
    currentPrice: number;
    minPrice: number;
    attempts: number;
    merchantMood:
        | "greedy"
        | "neutral"
        | "friendly"
        | "angry";
    completed: boolean;
    processing: boolean;
    startedAt: number;
    awaitingPayment: boolean;
    paymentVerified: boolean;
    mintTransactionId: string | null;
    serialNumber: number | null;
};