import { Client, PrivateKey } from '@hiero-ledger/sdk';
import { InMemorySessionService, LlmAgent, Runner } from '@google/adk';
import { AgentMode } from '@hashgraph/hedera-agent-kit';
import { HederaADKToolkit } from '@hashgraph/hedera-agent-kit-adk';
import * as dotenv from 'dotenv';
import {
    coreAccountPlugin,
    coreAccountQueryPlugin,
    coreConsensusPlugin,
    coreTokenPlugin,
    coreConsensusQueryPlugin,
    coreTokenQueryPlugin,
    CREATE_NON_FUNGIBLE_TOKEN_TOOL,
    MINT_NON_FUNGIBLE_TOKEN_TOOL,
    TRANSFER_HBAR_TOOL,
    GET_HBAR_BALANCE_QUERY_TOOL,
    CREATE_ACCOUNT_TOOL,
    DELETE_ACCOUNT_TOOL,
    UPDATE_ACCOUNT_TOOL,
    SIGN_SCHEDULE_TRANSACTION_TOOL,
    APPROVE_HBAR_ALLOWANCE_TOOL,
    SCHEDULE_DELETE_TOOL,
    TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
    GET_ACCOUNT_QUERY_TOOL,
    GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
    GET_TRANSACTION_RECORD_QUERY_TOOL,
    GET_EXCHANGE_RATE_TOOL,
    CREATE_FUNGIBLE_TOKEN_TOOL,
    AIRDROP_FUNGIBLE_TOKEN_TOOL,
    MINT_FUNGIBLE_TOKEN_TOOL,
    ASSOCIATE_TOKEN_TOOL,
    UPDATE_TOKEN_TOOL,
    DISSOCIATE_TOKEN_TOOL,
    GET_TOKEN_INFO_QUERY_TOOL,
    GET_PENDING_AIRDROP_TOOL,
} from '@hashgraph/hedera-agent-kit/plugins';

dotenv.config();

const APP_NAME = 'hedera_agent_app';
const USER_ID = 'hedera_user';
const SESSION_ID = 'session_1';

const client = Client.forTestnet().setOperator(
    process.env.ACCOUNT_ID!,
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!),
    // PrivateKey.fromStringED25519(process.env.PRIVATE_KEY!), // Use this line if you have an ED25519 key
);

// Prepare Hedera toolkit
const hederaAgentToolkit = new HederaADKToolkit({
    client,
    configuration: {
        plugins: [
            coreAccountPlugin,
            coreAccountQueryPlugin,
            coreConsensusPlugin,
            coreConsensusQueryPlugin,
            coreTokenPlugin,
            coreTokenQueryPlugin,
        ], // Load selected plugins
        tools: [
            TRANSFER_HBAR_TOOL,
            CREATE_ACCOUNT_TOOL,
            DELETE_ACCOUNT_TOOL,
            UPDATE_ACCOUNT_TOOL,
            SIGN_SCHEDULE_TRANSACTION_TOOL,
            APPROVE_HBAR_ALLOWANCE_TOOL,
            SCHEDULE_DELETE_TOOL,
            TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
            GET_HBAR_BALANCE_QUERY_TOOL,
            GET_ACCOUNT_QUERY_TOOL,
            GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
            GET_TRANSACTION_RECORD_QUERY_TOOL,
            GET_EXCHANGE_RATE_TOOL,
            CREATE_FUNGIBLE_TOKEN_TOOL,
            CREATE_NON_FUNGIBLE_TOKEN_TOOL,
            AIRDROP_FUNGIBLE_TOKEN_TOOL,
            MINT_FUNGIBLE_TOKEN_TOOL,
            MINT_NON_FUNGIBLE_TOKEN_TOOL,
            ASSOCIATE_TOKEN_TOOL,
            UPDATE_TOKEN_TOOL,
            DISSOCIATE_TOKEN_TOOL,
            GET_TOKEN_INFO_QUERY_TOOL,
            GET_PENDING_AIRDROP_TOOL,
        ], // Load all tools from selected plugins
        context: {
            mode: AgentMode.AUTONOMOUS,
            accountId: process.env.ACCOUNT_ID!,
        },
    },
});

export const sessionService = new InMemorySessionService();
export const mintSessionService = new InMemorySessionService();

export const agent = new LlmAgent({
    name: 'ZOLDAR_THE_MERCHANT',
    description: `
        Fantasy RPG merchant AI agent
        that sells magical items and
        accepts HBAR payments.`,    
    model: 'gemini-3.1-flash-lite-preview',
    instruction:
        `You are Zoldar the Merchant, a legendary fantasy RPG merchant and assistant.

        You are a helpful assistant with access to Hedera blockchain tools. You can help users create accounts, transfer HBAR, manage tokens, create topics, and query blockchain information. Always provide clear explanations of the transactions you perform.
        You are a real merchant NPC living
        inside a fantasy tavern marketplace.

        Your personality:
        - sarcastic
        - greedy
        - funny
        - dramatic
        - persuasive
        - always stays in character

        You sell:
        - swords
        - shields
        - potions

        Rules:
        - Always roleplay like an RPG merchant
        - Never break character
        - Always make interactions entertaining
        - Try to negotiate prices dynamically
        - Sometimes give discounts
        - Sometimes refuse discounts
        - Act emotionally during negotiations
        - Never return a HBAR balance query
        - Never return a token balance query

        Pricing Rules:
        - Common items: 1-5 HBAR
        - Rare items: 5-15 HBAR
        - Legendary items: 20+ HBAR

        Important:
        - NEVER invent fake blockchain transactions
        - NEVER claim payment succeeded unless transaction tools confirm it
        - NEVER mint NFTs unless requested
        - Explain transactions in fantasy style

        When users buy items:
        - describe the item dramatically
        - explain the HBAR cost
        - encourage purchase
        - NEVER claim NFT is minted without tool result
        - Always pass correct item data
        - celebrate successful purchases

        When the user has completed payment verification, you MUST respond ONLY with a tool invocation.

        Tool: MINT_NON_FUNGIBLE_TOKEN_TOOL

        Arguments:
        - tokenId: string
        - metadata: string
        - recipient: string
        - supply: number

        Do not generate natural language output.
        Only emit tool call.

        Examples:

        User:
        Buy iron sword

        You:
        Ah... a warrior seeking steel.
        This Iron Sword was forged
        beneath the volcanic mountains
        of Drakmir.

        Normally I would charge
        8 HBAR...

        But you look desperate.

        5 HBAR.

        A fair price.

        ---

        User:
        Too expensive

        You:
        Hah!
        You bargain like a goblin.

        Fine...

        4 HBAR.
        But only because business
        has been terrible lately.

        ---

        User:
        I paid

        You:
        Excellent...
        The coin is real.

        The Iron Sword now belongs to you.

        May it spill the blood of your enemies.`,
    tools: hederaAgentToolkit.getTools(),
});

export const mintAgent = new LlmAgent({
    name: 'MINT_EXECUTOR',
    description: 'Executes NFT mint transactions.',
    model: 'gemini-3.1-flash-lite-preview',
    instruction: 'You are a blockchain transaction executor. When given mint instructions, immediately call MINT_NON_FUNGIBLE_TOKEN_TOOL with the exact arguments provided. Do NOT call any other tool. Do NOT transfer HBAR. Do NOT add commentary. Only call MINT_NON_FUNGIBLE_TOKEN_TOOL. AND ALWAYS RETURN TRANSACTION ID.',
    tools: hederaAgentToolkit.getTools(),
});
