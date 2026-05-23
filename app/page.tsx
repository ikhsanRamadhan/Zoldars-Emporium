"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "./lib/Types/Message";
import TransactionCard from "./Components/TransactionCard";
import ItemCard from "./Components/ItemCard";
import MintSuccessCard from "./Components/MintSuccessCard";
import InventoryCard from "./Components/InventoryItemCard";
import { useWalletStore } from "@/app/Components/Store/wallet-store";
import { useHashinals } from "./Components/Layout/HashinalsProvider";
import { toast } from "sonner";
import { generateFrozenTransaction } from "@/app/Components/Actions/Action";
import { TokenAssociateTransaction } from "@hashgraph/sdk";
import { NegotiationState } from "./lib/Types/Negotiation";

const QUICK_COMMANDS = [
  { label: "Buy iron sword", icon: "⚔️" },
  { label: "Show inventory", icon: "📦" },
  { label: "Buy health potion", icon: "🧪" },
  { label: "Haggle for discount", icon: "💰" },
];

export default function MerchantPage() {
  const { accountId, isConnected, signer } = useWalletStore();
  const { connect, disconnect } = useHashinals();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "merchant",
      content:
        "Ah, a wanderer approaches! Welcome to Zoldar's Emporium of Mystical Wares! 🏪\n\nI deal in the finest weapons, potions, and enchanted trinkets across all nine realms. My prices are... *negotiable*, for those with the coin.\n\nWhat seeks thee today, adventurer?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [negotiationState, setNegotiationState] = useState<NegotiationState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const handleConnect = async () => {
    if (!isConnected || !accountId) {
      setIsLoading(true);
      await connect();
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    await disconnect();
    setIsLoading(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string, forcedAccountId?: string, payementSent: boolean = false, overrideNegotiationState?: NegotiationState | null) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    if (!isConnected || !accountId) {
      toast.error("Connect thy wallet first, adventurer!");
      handleConnect();
      return;
    }
  
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
  
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
  
    try {
      const activeWalletId = forcedAccountId || accountId;
  
      let historyPayload: { role: string; content: string }[] = [];
      setMessages((currentMessages) => {
        historyPayload = currentMessages.map((m) => ({
          role: m.role === "merchant" ? "assistant" : m.role,
          content: m.content,
        }));
        return currentMessages;
      });
  
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: content, 
          history: historyPayload,
          sessionId: sessionIdRef.current,
          userAccountId: activeWalletId,
          paymentSent: payementSent,
          negotiationState: overrideNegotiationState !== undefined 
            ? overrideNegotiationState 
            : negotiationState,
        }),
      });
  
      const data = await res.json();

      let updatedNegotiation = negotiationState;
      if ('negotiationState' in data) {
          updatedNegotiation = data.negotiationState;
          setNegotiationState(data.negotiationState);
      }
  
      const merchantMsg: Message = {
        id: crypto.randomUUID(),
        role: "merchant",
        content: data.message,
        timestamp: new Date(),
        transaction: data.transaction,
        itemOffered: data.itemOffered,
        inventory: data.inventory,
        action: data.action,
        negotiatedPrice: updatedNegotiation && updatedNegotiation.currentPrice !== updatedNegotiation.originalPrice
          ? updatedNegotiation.currentPrice
          : undefined,
        mintSuccess: data.action === 'MINT_SUCCESS' ? {
          item: data.itemOffered,
          serialNumber: data.serialNumber,
          transactionId: data.transactionId,
          hashscanUrl: data.hashscanUrl,
        } : undefined,
      };
  
      setMessages((prev) => [...prev, merchantMsg]);
  
      if (data.action === 'REQUEST_WALLET') {
        toast.error('Please connect your wallet first.');
        handleConnect();
      } else if (data.action === 'TRIGGER_HBAR_TRANSFER') {
        await handleHederaWalletTransfer(data.merchantAccount, data.amountHbar, activeWalletId?.toString() ?? '', updatedNegotiation);
      } else if (data.action === 'NEED_ASSOCIATION') {
        const associateTx = new TokenAssociateTransaction()
            .setAccountId(accountId!.toString())
            .setTokenIds([data.tokenId]);
        
        const assocRes = await (await associateTx.executeWithSigner(signer)).getReceiptWithSigner(signer);

        if (assocRes.status.toString() !== "SUCCESS") {
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            role: "system",
            content: "⚠️ Association transaction failed.",
            timestamp: new Date(),
          }])
        }
    
        await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: 'paid',
                sessionId: sessionIdRef.current,
                userAccountId: accountId!.toString(),
                paymentSent: true,
                associationDone: true,
                negotiationState: overrideNegotiationState !== undefined 
                  ? overrideNegotiationState 
                  : negotiationState,
            }),
        });
      } else if (data.action === 'MINT_SUCCESS') {
        toast.success(`✨ Success! Item ${data.itemOffered.name} is minted to your wallet.`);
        sessionIdRef.current = crypto.randomUUID();
        setNegotiationState(null);
      }
  
    } catch (error) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "system",
        content: "⚠️ The crystal ball is cloudy... connection to the Hedera realm failed.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }
  
  const handleHederaWalletTransfer = async (targetAccount: string, amount: number, currentWalletId: string, currentNegotiationState: NegotiationState | null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "system",
        content: `⚡ Initiating blockchain transaction: Sending ${amount} HBAR to ${targetAccount}...`,
        timestamp: new Date(),
      },
    ]);
    
    try {
      if (!currentWalletId) {
        toast.error('Please connect your wallet first.');
        return;
      }

      const { Transaction } = await import("@hashgraph/sdk");

      const userAccountIdStr = signer.getAccountId().toString();
      if (!userAccountIdStr) toast.error('Please connect your wallet first.');

      const serverResult = await generateFrozenTransaction(userAccountIdStr, amount);
      
      if (!serverResult.success || !serverResult.transactionBytesB64) {
        toast.error('Failed to generate transaction.');
      }

      const base64Str: string = serverResult.transactionBytesB64?.toString() ?? '';

      const transactionBuffer = Buffer.from(base64Str, "base64");
      const frozenTransaction = Transaction.fromBytes(transactionBuffer);

      const txResponse = await frozenTransaction.executeWithSigner(signer);
      const receipt = await txResponse.getReceiptWithSigner(signer);

      const transferSuccess = receipt.status.toString() === "SUCCESS";

      if (transferSuccess) {
        toast.success(`✨ Success! ${amount} HBAR transferred to vault.`);
        
        await sendMessage(`I have paid ${amount} HBAR`, currentWalletId, true, currentNegotiationState);
      } else {
        toast.error('Transfer failed.');
        await sendMessage('Transfer failed or was canceled.', currentWalletId);
      }
    } catch (walletError) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: `❌ Wallet transaction rejected: ${walletError}`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="relative mx-auto flex h-screen w-screen flex-col bg-[#0a0804] font-serif text-[#e8dcc8] antialiased">
      {/* Background Glow Effect */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(180,120,20,0.08)_0%,transparent_70%),radial-gradient(ellipse_40%_30%_at_10%_80%,rgba(100,40,10,0.1)_0%,transparent_60%)]" />

      {/* Header Component */}
      <header className="sticky top-0 z-50 border-b border-[rgba(180,130,40,0.25)] bg-[#0a0804]/80 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full border-2 border-[rgba(200,150,40,0.5)] bg-linear-to-br from-[#3d2005] to-[#7a4010] text-2xl after:absolute after:-inset-1 after:rounded-full after:border after:border-[rgba(200,150,40,0.2)]">
            🧙
          </div>
          <div className="flex flex-col">
            <h1 className="font-cinzel text-lg font-semibold tracking-wider text-[#d4a843] harmonies-heading">
              Zoldar&apos;s Emporium
            </h1>
            <p className="mt-0.5 text-xs italic text-[#8a7560] flex items-center">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#3fb950] shadow-[0_0_6px_#3fb950]" />
              Mystical NPC Merchant · Hedera Testnet
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isConnected && accountId ? (
              <>
                <div className="rounded-full border border-[rgba(180,130,40,0.3)] bg-[#1e1405]/80 px-2.5 py-1 font-mono text-[11px] tracking-wider text-[#b8900a]">
                  {accountId.slice(0, 6)}…{accountId.slice(-4)}
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="rounded-full border border-[rgba(180,60,40,0.4)] bg-[rgba(180,60,40,0.08)] px-2.5 py-1 font-mono text-[11px] tracking-wider text-[#c0604a] transition-all duration-150 hover:bg-[rgba(180,60,40,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "…" : "Sign out"}
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="rounded-full border border-[rgba(180,130,40,0.5)] bg-[rgba(180,130,40,0.12)] px-3 py-1.5 font-mono text-[11px] tracking-wider text-[#d4a843] transition-all duration-150 hover:bg-[rgba(180,130,40,0.22)] hover:shadow-[0_0_12px_rgba(180,130,40,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Connecting…" : "⬡ Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Wallet Gate Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-[#0a0804]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[rgba(180,130,40,0.25)] bg-[#14100a]/90 px-8 py-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[rgba(200,150,40,0.4)] bg-linear-to-br from-[#3d2005] to-[#7a4010] text-3xl">
              🔐
            </div>
            <div>
              <h2 className="font-cinzel text-base font-semibold tracking-wider text-[#d4a843]">
                Wallet Required
              </h2>
              <p className="mt-1.5 text-sm italic text-[#6a5a45]">
                Connect thy Hedera wallet to enter<br />Zoldar&apos;s Emporium
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="mt-1 w-full rounded-full border border-[rgba(180,130,40,0.5)] bg-[rgba(180,130,40,0.15)] px-6 py-2.5 font-cinzel text-sm font-semibold tracking-wider text-[#d4a843] transition-all duration-200 hover:bg-[rgba(180,130,40,0.28)] hover:shadow-[0_0_20px_rgba(180,130,40,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#b8900a] border-t-transparent" />
                  Connecting…
                </span>
              ) : (
                "⬡ Connect Wallet"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chat History Area */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 z-10 sm:px-6">
        <div className="py-1 pb-4 text-center font-mono text-[11px] tracking-widest text-[#3a3025]">
          ⟡ SCROLL OF COMMERCE ⟡
        </div>

        <div className="space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-[fadeUp_0.3s_ease] ${
                msg.role === "user" ? "flex-row-reverse" : msg.role === "system" ? "justify-center" : ""
              }`}
            >
              {msg.role !== "system" && (
                <div
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${
                    msg.role === "merchant"
                      ? "border border-[rgba(180,130,40,0.3)] bg-[rgba(100,60,10,0.5)]"
                      : "border border-[rgba(60,100,180,0.3)] bg-[rgba(20,40,80,0.5)]"
                  }`}
                >
                  {msg.role === "merchant" ? "🧙" : "⚔️"}
                </div>
              )}

              <div className={`max-w-[78%] ${msg.role === "user" ? "flex flex-col items-end text-right" : ""}`}>
                {msg.role !== "system" && (
                  <div
                    className={`font-cinzel text-[11px] font-semibold tracking-widest mb-1.5 ${
                      msg.role === "merchant" ? "text-[#b8900a]" : "text-[#5e8cdb]"
                    }`}
                  >
                    {msg.role === "merchant" ? "ZOLDAR THE MERCHANT" : "ADVENTURER"}
                  </div>
                )}

                <div
                  className={`px-4 py-3 text-base leading-relaxed whitespace-pre-wrap shadow-md ${
                    msg.role === "merchant"
                      ? "rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-[rgba(180,130,40,0.2)] bg-[rgba(40,25,8,0.7)] text-[#e8dcc8]"
                      : msg.role === "user"
                      ? "rounded-tl-2xl rounded-br-2xl rounded-bl-2xl border border-[rgba(60,100,180,0.2)] bg-[rgba(20,35,70,0.7)] text-[#d0dcf4]"
                      : "rounded-lg border border-white/5 bg-white/3 px-3.5 py-2 text-xs text-[#6b6b6b]"
                  }`}
                >
                  {msg.content}
                </div>

                {msg.inventory && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {msg.inventory.map((item) => (
                      <InventoryCard key={item.itemId} item={item} />
                    ))}
                  </div>
                )}
                {msg.itemOffered && <ItemCard item={msg.itemOffered} negotiatedPrice={msg.negotiatedPrice} />}
                {msg.transaction && <TransactionCard tx={msg.transaction} />}
                {msg.mintSuccess && (
                  <MintSuccessCard
                    item={msg.mintSuccess.item}
                    serialNumber={msg.mintSuccess.serialNumber}
                    transactionId={msg.mintSuccess.transactionId}
                    hashscanUrl={msg.mintSuccess.hashscanUrl}
                  />
                )}

                {msg.role !== "system" && (
                  <div className="mt-1 font-mono text-[11px] text-[#4a4030]">
                    {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 animate-[fadeUp_0.3s_ease]">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg border border-[rgba(180,130,40,0.3)] bg-[rgba(100,60,10,0.5)]">
                🧙
              </div>
              <div className="max-w-[78%]">
                <div className="font-cinzel text-[11px] font-semibold tracking-widest mb-1.5 text-[#b8900a]">
                  ZOLDAR THE MERCHANT
                </div>
                <div className="rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-[rgba(180,130,40,0.2)] bg-[rgba(40,25,8,0.7)] px-4 py-3 shadow-md">
                  <div className="flex items-center gap-1 py-1.5 px-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b8900a] opacity-60" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b8900a] opacity-60 [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b8900a] opacity-60 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Quick Actions Panel */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3 z-10 sm:px-6">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            className="shrink-0 whitespace-nowrap rounded-full border border-[rgba(180,130,40,0.2)] bg-[#1e1405]/60 px-3 py-1.5 font-serif text-sm text-[#9a8060] transition-all duration-150 hover:border-[rgba(180,130,40,0.5)] hover:bg-[#50320a]/50 hover:text-[#d4a843] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => sendMessage(cmd.label)}
            disabled={loading}
          >
            {cmd.icon} {cmd.label}
          </button>
        ))}
      </div>

      {/* Input Message Form */}
      <div className="sticky bottom-0 z-50 border-t border-[rgba(180,130,40,0.15)] bg-[#0a0804]/85 px-4 pb-5 pt-3 backdrop-blur-md sm:px-6 sm:pb-6">
        <div className="flex items-center gap-2.5 rounded-full border border-[rgba(180,130,40,0.25)] bg-[#191208]/80 p-1.5 pl-4.5 transition-all focus-within:border-[rgba(180,130,40,0.6)] focus-within:shadow-[0_0_0_3px_rgba(180,130,40,0.06)]">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent font-serif text-base text-[#e8dcc8] outline-none placeholder:italic placeholder:text-[#5a4a35]"
            placeholder="Speak thy request, adventurer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading || !isConnected}
            autoFocus
          />
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(180,130,40,0.9)] text-base text-[#1a1005] transition-all duration-150 hover:scale-105 hover:bg-[#d4a843] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || !isConnected}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}