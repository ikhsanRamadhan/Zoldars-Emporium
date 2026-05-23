export function isInventoryRequest(message: string) {
    const lower = message.toLowerCase();

    return [
        "inventory",
        "show inventory",
        "what do you have",
        "items you sell",
        "shop list",
        "stock",
    ].some((w) => lower.includes(w));
}