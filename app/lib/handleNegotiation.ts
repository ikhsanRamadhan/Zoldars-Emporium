import { NegotiationState } from "@/app/lib/Types/Negotiation";

export function handleNegotiation(
    state: NegotiationState
) {
    state.attempts += 1;

    const discount =
        Math.floor(Math.random() * 2) + 1;

    const nextPrice =
        state.currentPrice - discount;

    if (nextPrice <= state.minPrice) {
        state.merchantMood = "angry";

        return {
            accepted: false,
            message:
                "Enough! I will not lower the price further.",
        };
    }

    state.currentPrice = nextPrice;

    state.merchantMood =
        state.attempts >= 3
            ? "angry"
            : "friendly";

    return {
        accepted: true,
    };
}