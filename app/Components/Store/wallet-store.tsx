import { AccountId } from "@hashgraph/sdk";
import { create } from "zustand";

interface WalletState {
    accountId: string | undefined;
    accountIdObj: AccountId | null;
    balance: string;
    isConnected: boolean;
    signer: any | null;
    setAll: (payload: Partial<WalletState>) => void;
};

export const useWalletStore = create<WalletState>((set) => ({
    accountId: undefined,
    accountIdObj: null,
    balance: '0',
    isConnected: false,
    signer: null,
    setAll: (payload) => set((state) => ({ ...state, ...payload })),
}));