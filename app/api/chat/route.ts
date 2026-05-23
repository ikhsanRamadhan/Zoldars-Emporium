import { NextRequest, NextResponse } from 'next/server';
import { agent, mintAgent, mintSessionService, sessionService } from '@/app/lib/Agent';
import { Content, Part } from '@google/genai';
import { isFinalResponse, Runner } from '@google/adk';

import { findItemFromMessage, findSimilarItems } from '@/app/lib/SearchItems';
import { NegotiationState } from '@/app/lib/Types/Negotiation';
import { handleNegotiation } from '@/app/lib/handleNegotiation';
import { isNegotiating } from '@/app/lib/isNegotiating';
import { INVENTORY } from '@/app/lib/Types/InventoryItems';
import { isInventoryRequest } from '@/app/lib/isInventoryRequest';
import { ITEMS } from '@/app/lib/Items/Index';
import { Item } from '@/app/lib/Items/Index';
import { verifyPayment } from '@/app/lib/VerifyPayment';
import { Client } from '@hiero-ledger/sdk';

const USER_ID = 'hedera_user';
const APP_NAME = 'hedera_agent_app';
const MERCHANT_ACCOUNT_ID = process.env.ACCOUNT_ID!;

function extractPriceFromText(text: string): number | null {
    const boldMatch = text.match(/\*\*(\d+(?:\.\d+)?)\s*HBAR\*\*/i);
    if (boldMatch) return parseFloat(boldMatch[1]);

    const allMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*HBAR/gi)];
    if (allMatches.length === 0) return null;
    return parseFloat(allMatches[allMatches.length - 1][1]);
}

const INTEREST_KEYWORDS = ['i will buy', 'i want to buy', 'i\'d like to buy', 'i want', 'i\'d like', 'looking for', 'interested in'];
const CONFIRM_KEYWORDS = ['buy now', 'purchase now', 'agree', 'deal', 'yes deal', 'i\'ll take it', 'take it', 'i accept', 'confirm', 'let\'s do it'];

const isInterested = (input: string) =>
    INTEREST_KEYWORDS.some(kw => input.toLowerCase().includes(kw));

const isBuying = (input: string) => {
    const lower = input.toLowerCase();
    if (isInterested(input)) return false;
    return CONFIRM_KEYWORDS.some(kw => lower.includes(kw));
};

function formatItemsForPrompt(items: Item[]): string {
    return items.map(item =>
        `- ${item.name} (${item.rarity} ${item.category}): ${item.price} HBAR | Stock: ${item.stock} | ${item.description}`
    ).join('\n');
}

function buildInventoryMessage() {
    return `🧙 ZOLDAR'S WAREHOUSE\n\nBehold my collection of cursed and blessed artifacts...\n\nBrowse wisely, adventurer.`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const userInput: string = body.message;
        const sessionId: string = body.sessionId;
        const paymentSent: boolean = body.paymentSent ?? false;
        let negotiation: NegotiationState | null = body.negotiationState ?? null;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        console.log('[DEBUG] negotiation from store:', JSON.stringify(negotiation));
        console.log('[DEBUG] userInput:', userInput);
        console.log('[DEBUG] isNegotiating:', isNegotiating(userInput));

        if (isInventoryRequest(userInput)) {
            return NextResponse.json({
                message: buildInventoryMessage(),
                inventory: INVENTORY,
                negotiationState: negotiation,
            });
        }

        const item = findItemFromMessage(userInput);
        const similarItems = findSimilarItems(userInput, 3);

        if (item && !negotiation) {
            negotiation = {
                item,
                originalPrice: item.price,
                currentPrice: item.price,
                minPrice: Math.max(1, item.price * 0.7),
                attempts: 0,
                merchantMood: 'neutral',
                completed: false,
                processing: false,
                startedAt: Math.floor(Date.now() / 1000),
                awaitingPayment: false,
                paymentVerified: paymentSent,
                mintTransactionId: null,
                serialNumber: null
            };
        }

        if (negotiation && isNegotiating(userInput)) {
            handleNegotiation(negotiation);

            const offeredPrice = extractPriceFromText(userInput);
            if (offeredPrice !== null) {
                if (offeredPrice >= negotiation.minPrice) {
                    negotiation.currentPrice = offeredPrice;
                }
            }
        }

        const relevantItems = negotiation
            ? [negotiation.item]
            : similarItems.map(r => r.item);

        let enhancedPrompt: string;

        if (negotiation) {
            enhancedPrompt = `
            You are Zoldar the RPG Merchant.
            And You are a helpful assistant with access to Hedera blockchain tools. You can help users create accounts, transfer HBAR, manage tokens, create topics, and query blockchain information. Always provide clear explanations of the transactions you perform.

            CURRENT ITEM:
            - Name: ${negotiation.item.name}
            - Description: ${negotiation.item.description}
            - Rarity: ${negotiation.item.rarity}

            PRICING STATE:
            - Original price: ${negotiation.originalPrice} HBAR
            - Current price: ${negotiation.currentPrice} HBAR
            - Minimum price: ${negotiation.minPrice} HBAR
            - Attempts: ${negotiation.attempts}
            - Mood: ${negotiation.merchantMood}

            RULES:
            - Stay in character as a dramatic RPG merchant
            - Do NOT change price outside given range
            - React emotionally to negotiation
            - If user expresses interest but hasn't confirmed (e.g. "I will buy", "I want"), present the item dramatically and ask them to confirm the deal — do NOT assume they agreed
            - Only treat it as a confirmed sale if user says: "deal", "agree", "I'll take it", "buy now", "confirm"

            User message:
            ${userInput}
            `.trim();
        } else if (relevantItems.length > 0) {
            enhancedPrompt = `
            You are Zoldar the RPG Merchant.
            And You are a helpful assistant with access to Hedera blockchain tools. You can help users create accounts, transfer HBAR, manage tokens, create topics, and query blockchain information. Always provide clear explanations of the transactions you perform.

            The user is asking about items. Here are the EXACT items you have in stock.
            ONLY refer to these items — do NOT invent items that are not listed.

            MATCHING ITEMS IN YOUR INVENTORY:
            ${formatItemsForPrompt(relevantItems)}

            
            RULES:
            - Only mention items from the list above
            - Include the exact price in HBAR
            - Stay in character as a dramatic RPG merchant
            - If stock is 0, tell the user it's sold out
            - If user says "I will buy" or "I want to buy", present the item with flair and ask them to confirm — do NOT skip straight to payment
            - Only proceed to deal when user explicitly confirms

            User message:
            ${userInput}
            `.trim();
        } else {
            enhancedPrompt = `
            You are Zoldar the RPG Merchant.
            And You are a helpful assistant with access to Hedera blockchain tools. You can help users create accounts, transfer HBAR, manage tokens, create topics, and query blockchain information. Always provide clear explanations of the transactions you perform.

            Your COMPLETE inventory (ONLY sell items from this list):
            ${formatItemsForPrompt(ITEMS)}

            RULES:
            - NEVER mention or sell items not in the list above
            - Always quote exact prices in HBAR
            - Stay in character

            User message:
            ${userInput}
            `.trim();
        }

        const newMessage: Content = {
            role: 'user',
            parts: [{ text: enhancedPrompt } as Part],
        };

        await sessionService.createSession({
            appName: APP_NAME,
            sessionId,
            userId: USER_ID,
        });

        const runner = new Runner({
            appName: APP_NAME,
            agent,
            sessionService,
        });

        const events = runner.runAsync({
            userId: USER_ID,
            sessionId,
            newMessage,
        });

        let finalResponse = '';
        for await (const event of events) {
            if (isFinalResponse(event)) {
                for (const part of event.content?.parts ?? []) {
                    if (part.text) finalResponse += part.text;
                }
            }
        }

        if (negotiation && negotiation.attempts > 0) {
            const aiPrice = extractPriceFromText(finalResponse);
            if (aiPrice !== null && aiPrice >= negotiation.minPrice && aiPrice <= negotiation.currentPrice) {
                negotiation.currentPrice = aiPrice;
            }
        }
        if (negotiation?.completed) {
            return NextResponse.json({
                message: finalResponse,
                itemOffered: null,
                negotiatedPrice: null,
                originalPrice: null,
            });
        }

        if (negotiation?.processing) {
            return NextResponse.json({
                message: `⏳ Your transaction is being processed, patience traveler!`,
                action: 'PROCESSING',
            });
        }

        const userAccountId = body.userAccountId as string | undefined;

        if (isBuying(userInput) && negotiation && !negotiation.awaitingPayment) {
            if (!userAccountId) {
                return NextResponse.json({
                    message: `${finalResponse}\n\n🧙 *Zoldar gestures:* "Thy hands are bare! Connect thy wallet!"`,
                    action: 'REQUEST_WALLET',
                    negotiationState: negotiation,
                });
            }

            negotiation.awaitingPayment = true;
            negotiation.startedAt = Math.floor(Date.now() / 1000);

            return NextResponse.json({
                message: `${finalResponse}\n\n⚔️ Send exactly ${negotiation.currentPrice} HBAR to my vault, traveler!`,
                action: 'TRIGGER_HBAR_TRANSFER',
                merchantAccount: MERCHANT_ACCOUNT_ID,
                amountHbar: negotiation.currentPrice,
                negotiationState: negotiation,
            });
        }

        const isPaid = body.paymentSent === true;

        if (isPaid && negotiation?.awaitingPayment && userAccountId) {
            if (negotiation.processing) {
                return NextResponse.json({
                    message: `⏳ Already processing your transaction!`,
                    action: 'PROCESSING',
                });
            }

            negotiation.processing = true;

            try {
                const negotiationStartTime = negotiation.startedAt;
                const TOKENID = process.env.NEXT_PUBLIC_TOKEN_ID ?? '';

                console.log(`[Zoldar Audit] Checking payment for ${userAccountId} - Amount: ${negotiation.currentPrice} HBAR since: ${negotiationStartTime}`);

                await new Promise(resolve => setTimeout(resolve, 3000));
                const paid = await verifyPayment(userAccountId, negotiation.currentPrice, negotiationStartTime);

                if (!paid) {
                    negotiation.processing = false;
                    negotiation.awaitingPayment = false;
                    negotiation.startedAt = Math.floor(Date.now() / 1000);

                    return NextResponse.json({
                        message: `🧙 *Zoldar squints at the ledger...* "The coin has not arrived yet, traveler. The Mirror Node speaks no lie. Try again once your gold is confirmed."`,
                        action: 'PAYMENT_NOT_FOUND',
                        merchantAccount: MERCHANT_ACCOUNT_ID,
                        amountHbar: negotiation.currentPrice,
                        negotiationState: negotiation,
                    });
                }

                const mintSessionId = `mint_${crypto.randomUUID()}`;
                await mintSessionService.createSession({
                    appName: APP_NAME,
                    sessionId: mintSessionId,
                    userId: USER_ID,
                });

                const mintRunner = new Runner({
                    appName: APP_NAME,
                    agent: mintAgent,
                    sessionService: mintSessionService,
                });

                const mintCommandPrompt: Content = {
                    role: 'user',
                    parts: [{ 
                        text: `Mint 1 NFT to my account with token id: ${TOKENID} and metadata: ${negotiation.item.metadata}`
                    } as Part],
                };

                const mintEvents = mintRunner.runAsync({
                    userId: USER_ID,
                    sessionId: mintSessionId,
                    newMessage: mintCommandPrompt,
                });

                let mintResponse = '';
                for await (const event of mintEvents) {
                    if (isFinalResponse(event)) {
                        for (const part of event.content?.parts ?? []) {
                            if (part.text) mintResponse += part.text;
                        }
                    }
                }

                const txMatch = mintResponse.match(/0\.0\.\d+@[\d.]+/);
                const transactionId = txMatch?.[0] ?? null;

                if (!transactionId) {
                    negotiation.processing = false;

                    return NextResponse.json({
                        message: `🔮 *Zoldar's orb flickers...* "The artifact resists conjuration! Your gold arrived, but the enchantment failed. Speak to me again to retry."`,
                        action: 'MINT_FAILED',
                        mintRawResponse: mintResponse,
                        negotiationState: negotiation,
                    });
                }

                negotiation.mintTransactionId = transactionId;

                const { TransferTransaction, TokenId, AccountId, NftId } = await import('@hiero-ledger/sdk');
                const client = Client.forTestnet();
                client.setOperator(process.env.ACCOUNT_ID!, process.env.PRIVATE_KEY!);

                await new Promise(resolve => setTimeout(resolve, 4000));

                const mirrorTxId = transactionId
                    .replace('@', '-')
                    .replace(/\.(\d+)$/, '-$1');

                const mirrorRes = await fetch(
                    `https://testnet.mirrornode.hedera.com/api/v1/transactions/${mirrorTxId}`
                );
                const mirrorData = await mirrorRes.json();
                const serialNumber: number | null = mirrorData?.transactions?.[0]?.nft_transfers?.[0]?.serial_number ?? null;

                console.log(`[Zoldar Audit] Miriror Node Transaction: ${mirrorData.transactions?.[0]}`);
                console.log(`[Zoldar Audit] Serial Number: ${serialNumber}`);

                if (serialNumber === null) {
                    negotiation.processing = false;

                    return NextResponse.json({
                        message: `🔮 *Zoldar frowns...* "The artifact was forged but the serial rune is missing! Contact the guild master."`,
                        action: 'MINT_FAILED',
                        transactionId,
                        negotiationState: negotiation,
                    });
                }

                negotiation.serialNumber = serialNumber;

                const associationDone: boolean = body.associationDone === true;

                if (!associationDone) {
                    const assocRes = await fetch(
                        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${userAccountId}/tokens?token.id=${TOKENID}`
                    );
                    const assocData = await assocRes.json();
                    const isAssociated = (assocData?.tokens?.length ?? 0) > 0;

                    if (!isAssociated) {
                        negotiation.processing = false;

                        return NextResponse.json({
                            message: `🧙 *Zoldar holds up the artifact...* "Before I hand this over, your satchel must be prepared to hold it! Associate the token first, then return to me."`,
                            action: 'NEED_ASSOCIATION',
                            tokenId: TOKENID,
                            serialNumber,
                            mintTransactionId: transactionId,
                            negotiationState: negotiation,
                        });
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 3000));

                console.log('[Zoldar] Using TOKENID:', TOKENID);

                const transferTx = await new TransferTransaction()
                    .addNftTransfer(
                        new NftId(TokenId.fromString(TOKENID), serialNumber),
                        AccountId.fromString(process.env.ACCOUNT_ID!),
                        AccountId.fromString(userAccountId),
                    )
                    .execute(client);

                const transferReceipt = await transferTx.getReceipt(client);

                console.log('[Zoldar] Transfer Status:', transferReceipt.status.toString());

                if (transferReceipt.status.toString() !== 'SUCCESS') {
                    negotiation.processing = false;

                    return NextResponse.json({
                        message: `🔮 *Zoldar curses under his breath...* "The artifact was minted but delivery failed! Status: ${transferReceipt.status}"`,
                        action: 'TRANSFER_FAILED',
                        transactionId,
                        serialNumber,
                        negotiationState: negotiation,
                    });
                }

                const transferTxId = transferTx.transactionId.toString();
                const hashscanUrl = `https://hashscan.io/testnet/transaction/${transferTxId}`;

                console.log(`[Zoldar Audit] Transfer URL: ${hashscanUrl}`);

                negotiation.completed = true;

                return NextResponse.json({
                    message: `🧙 *Zoldar cackles with satisfaction* "HA! The gold is mine and the artifact is yours! Serial #${serialNumber} — a fine acquisition, traveler. Now get out of my shop before I charge you for the air you breathe!"\n\n✨ NFT transferred to your account!`,
                    action: 'MINT_SUCCESS',
                    itemOffered: negotiation.item,
                    transactionId: transferTxId,
                    serialNumber,
                    hashscanUrl,
                    negotiationState: negotiation,
                });

            } catch (error) {
                console.error('Mint/Transfer error:', error);
                return NextResponse.json({
                    message: `🔮 *A dark energy disrupts the transaction...* "Something went wrong in the ethereal plane. Your gold is safe, try again."`,
                    action: 'MINT_FAILED',
                    error: error instanceof Error ? error.message : String(error),
                    negotiationState: negotiation,
                });
            }
        }

        return NextResponse.json({
            message: finalResponse,
            itemOffered: negotiation?.item ?? null,
            negotiatedPrice: negotiation?.currentPrice ?? null,
            originalPrice: negotiation?.originalPrice ?? null,
            negotiationState: negotiation,
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}