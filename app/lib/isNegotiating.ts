// isNegotiating.ts
const patterns = [
    /too\s*expensive/,
    /cheaper/,
    /discount/,
    /lower/,
    /haggle/,
    /reduce/,
    /price.*down/,
    /how\s*about\s+[\d.]+/i,
    /i('ll)?\s*pay\s+[\d.]+\s*hbar/i,
    /for\s+[\d.]+\s*hbar/i,
    /offer(ing)?\s+[\d.]+/i,
];

export function isNegotiating(message: string): boolean {
    const lower = message.toLowerCase();
    if (/i have paid|already paid|payment sent|paid/.test(lower)) return false;
    return patterns.some(r => r.test(lower));
}