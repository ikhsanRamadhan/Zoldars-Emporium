# 🧙 Zoldar's Emporium — AI RPG Merchant on Hedera

> *"Ah, a wanderer approaches! Welcome to Zoldar's Emporium of Mystical Wares!"*

An AI-powered RPG merchant chatbot built on the Hedera blockchain. Negotiate with Zoldar, haggle over prices, and receive real NFTs directly to your wallet — all on Hedera Testnet.

[![Demo Video](https://img.shields.io/badge/Demo-Watch%20on%20X-black?logo=x)](https://x.com/Ikhsan_dadan/status/2058167335090085915)
[![Hedera Testnet](https://img.shields.io/badge/Network-Hedera%20Testnet-6B3FA0)](https://hashscan.io/testnet)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?logo=next.js)](https://nextjs.org)

---

## ✨ What is This?

Zoldar's Emporium is a fully on-chain RPG merchant experience powered by:
- **Google Gemini** as the AI brain behind Zoldar's dramatic personality
- **Hedera Agent Kit** for all blockchain operations (mint, transfer, verify)
- **HashConnect** for wallet integration
- **Next.js** as the full-stack framework

You can browse Zoldar's inventory, haggle over prices, and when a deal is struck — pay in HBAR and receive a real NFT minted and transferred to your wallet, all on-chain.

---

## 🎮 How It Works

```
┌─────────────────────────────────────────────────────┐
│                  ZOLDAR'S EMPORIUM                  │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  User sends message │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────┐
│  AI Merchant responds           │
│  in character as Zoldar         │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  User haggles / offers price    │
│  Server validates price range   │
│  & updates negotiation state    │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  User confirms deal             │
│  → Wallet prompt to send HBAR   │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Payment verified via           │
│  Hedera Mirror Node             │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  NFT minted + transferred       │
│  to user's wallet               │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Serial number + HashScan       │
│  receipt returned to UI         │
└─────────────────────────────────┘
```

### Real On-Chain Actions
| Action | Hedera Operation |
|--------|-----------------|
| Pay for item | HBAR transfer via `TransferTransaction` |
| Receive item | NFT mint + `TransferTransaction` (HTS) |
| Verify payment | Mirror Node REST API query |
| Token association | `TokenAssociateTransaction` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| AI | Google Gemini via Google ADK |
| Blockchain | Hedera Testnet (HTS, HBAR) |
| Wallet | HashConnect + `@hashgraph/sdk` |
| NFT Storage | IPFS via Pinata |
| Mirror Node | `testnet.mirrornode.hedera.com` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Hedera Testnet account ([create one free](https://portal.hedera.com))
- A Google Gemini API key ([get one here](https://aistudio.google.com))
- HashPack wallet browser extension

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/zoldars-emporium
cd zoldars-emporium
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Hedera operator account (merchant/server account)
ACCOUNT_ID=0.0.XXXXXXX
PRIVATE_KEY=your_private_key_here

# Hashinals Project ID
NEXT_PUBLIC_PROJECT_ID=your-hashinals-project-id

# Token ID for the NFT collection
NEXT_PUBLIC_TOKEN_ID=0.0.XXXXXXX

# Google Gemini
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your HashPack wallet.

---

## 🧙 Features

### Intelligent Price Negotiation
Zoldar has a real server-side negotiation engine — not just AI roleplay. Every offer is validated against a price floor (70% of original), mood system, and attempt counter. The AI responds in character but cannot go below the floor.

Original: 11 HBAR → Minimum: 7.7 HBAR
User offers 8 HBAR → Server accepts → AI confirms dramatically

### Fuzzy Item Search
Type "great sword", "health pot", or "shild" — the Levenshtein-based search engine finds the right item even with typos or spacing differences.

### Full NFT Purchase Flow
Connect Wallet → Browse/Haggle → Confirm Deal
→ Sign HBAR Transfer → Payment Verified on Mirror Node
→ NFT Minted → Token Associated → NFT Transferred
→ HashScan Receipt Displayed

### Stateless Architecture
Negotiation state is passed client → server → client on every request. No server-side session storage, works correctly in serverless environments.

---

## 📦 Project Structure
### Stateless Architecture
Negotiation state is passed client → server → client on every request. No server-side session storage, works correctly in serverless environments.

---

## 🔗 Hedera Agent Kit Usage

This project uses the Hedera Agent Kit for:

- **Token minting** — `mintAgent` mints NFTs with IPFS metadata
- **NFT transfers** — `TransferTransaction` with `NftId`
- **Payment verification** — Mirror Node API to confirm HBAR received
- **Token association** — `TokenAssociateTransaction` before NFT delivery

All transactions are verifiable on [HashScan Testnet](https://hashscan.io/testnet).

---

## 🎥 Demo

Watch the full demo:
[![Zoldars-Emporium](https://img.youtube.com/vi/DbNeBuMt2kY/0.jpg)](https://www.youtube.com/watch?v=DbNeBuMt2kY)

**Demo flow shown:**
1. Connect HashPack wallet
2. Browse inventory
3. Haggle with Zoldar over a Steel Greatsword
4. Confirm deal at negotiated price
5. Sign HBAR transfer in HashPack
6. Receive minted NFT with HashScan receipt

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

*Built with ⚔️ and HBAR. Now get out of Zoldar's shop before he charges you for the air you breathe.*
