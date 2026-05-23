import { Item, ITEMS } from './Items/Index';

function levenshtein(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
        Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
        dp[i][j] =
            a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[a.length][b.length];
}

function scoreItem(item: Item, query: string): number {
    const q = query.toLowerCase();
    const qNorm = q.replace(/\s+/g, '');
    const name = item.name.toLowerCase();
    const nameNorm = name.replace(/\s+/g, '');
    const category = item.category.toLowerCase();

    if (q.includes(name)) return 1000;
    if (qNorm.includes(nameNorm)) return 950;

    let score = 0;
    const nameTokens = name.split(' ');
    const queryTokens = q.split(' ');

    for (const token of nameTokens) {
        if (token.length < 3) continue;

        if (q.includes(token)) { score += 50; continue; }

        if (token.includes(queryTokens.find(qt => token.includes(qt)) ?? '')) score += 40;

        for (const qt of queryTokens) {
            if (qt.length < 3) continue;
            const dist = levenshtein(token, qt);
            const maxLen = Math.max(token.length, qt.length);
            const similarity = 1 - dist / maxLen;
            if (similarity >= 0.6) score += Math.round(similarity * 40);
        }

        const distNorm = levenshtein(token, qNorm);
        const simNorm = 1 - distNorm / Math.max(token.length, qNorm.length);
        if (simNorm >= 0.5) score += Math.round(simNorm * 50);
    }

    if (q.includes(category)) score += 20;

    const dist = levenshtein(nameNorm, qNorm);
    score += Math.round((1 - dist / Math.max(nameNorm.length, qNorm.length)) * 30);

    return score;
}

export type ScoredItem = { item: Item; score: number };

export function findItemFromMessage(message: string): Item | null {
    const results = findSimilarItems(message, 1);
    return results[0]?.item ?? null;
}

export function findSimilarItems(message: string, topN = 3): ScoredItem[] {
    const MIN_SCORE = 15;
    return ITEMS
        .map(item => ({ item, score: scoreItem(item, message) }))
        .filter(r => r.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}