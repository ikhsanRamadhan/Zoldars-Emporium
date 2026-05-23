'use client';
import { HashinalsWalletConnectSDK } from '@hashgraphonline/hashinal-wc';
import { 
    AccountId, LedgerId, Hbar, TransferTransaction,
} from '@hashgraph/sdk';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '../Store/wallet-store';
import { toast } from 'sonner';

interface HashinalsContextType {
    connect: () => void;
    disconnect: () => void;
    TransferHBAR: (targetAccount: string, amount: number) => Promise<boolean>;
};

let isGlobalInitializing = false;

const HashinalsContext = createContext<HashinalsContextType>({} as HashinalsContextType);

const env = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;
const network = LedgerId.fromString(env);

export const appMetadata = {
    name: "Zoldar's Emporium",
    description: "Mystical NPC Merchant",
    url: typeof window !== 'undefined' ? window.location.origin : "https://yourdomain.com",
    icons: ["https://wallet.hashinals.com/favicon.ico"],
};

export function HashinalsProvider({ children }: { children: React.ReactNode }) {
    const { setAll, accountId, signer } = useWalletStore();
    const [sdk, setSdk] = useState<HashinalsWalletConnectSDK | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const initSDK = useCallback(async () => {
        if (isInitialized || isGlobalInitializing) return;
        if (typeof window === 'undefined') return;

        isGlobalInitializing = true;

        try {
            const instance = HashinalsWalletConnectSDK.getInstance();
            await instance.init(projectId, appMetadata, LedgerId.TESTNET);
            setSdk(instance);

            if (!projectId) {
                throw new Error("NEXT_PUBLIC_PROJECT_ID is missing in .env");
            }

            const metadata = {
                ...appMetadata,
                url: window.location.origin
            };

            await new Promise(resolve => setTimeout(resolve, 200));

            const existingAccount = await instance.initAccount(projectId, metadata);

            if (existingAccount) {

                setAll({
                    accountId: existingAccount.accountId,
                    accountIdObj: AccountId.fromString(existingAccount.accountId),
                    balance: existingAccount.balance,
                    isConnected: true,
                    signer: instance.dAppConnector.getSigner(AccountId.fromString(existingAccount.accountId) as unknown as any)
                });

            } else {
                setAll({
                    accountId: undefined,
                    accountIdObj: null,
                    balance: '0',
                    isConnected: false,
                    signer: null
                })
            }

            setIsInitialized(true);
        } catch (error) {
            console.error('❌ Critical Init Error:', error);
            isGlobalInitializing = false;
        } finally {
            isGlobalInitializing = false;
        }
    }, [isInitialized, setAll]);

    useEffect(() => {
        initSDK();
    }, []);

    const connect = async () => {
        const currentSdk = sdk || await initSDK();
        if (!currentSdk) {
            toast.error("Wallet SDK not ready");
            return;
        }

        try {
            const { accountId: newId, balance } = await currentSdk.connectWallet(projectId, appMetadata, network);

            setAll({
                accountId: newId,
                accountIdObj: AccountId.fromString(newId),
                balance: balance,
                isConnected: true,
                signer: currentSdk.dAppConnector.getSigner(AccountId.fromString(newId) as unknown as any)
            });
            
            toast.success(`Welcome ${newId}`);
        } catch (error) {
            console.error('Connect error:', error);
            toast.error('Connection cancelled or failed');
        }
    };

    const disconnect = async () => {
        if (!sdk) return;
        const tempId = accountId;

        try {
            await sdk.disconnectWallet();

            setAll({
                accountId: undefined,
                accountIdObj: null,
                balance: '0',
                isConnected: false,
                signer: null
            });

            toast.success(`Goodbye ${tempId}`);
        } catch (error) {
            toast.error('Disconnect failed');
        } finally {
            await sdk.disconnectWallet();

            setAll({
                accountId: undefined,
                accountIdObj: null,
                balance: '0',
                isConnected: false,
                signer: null
            });
        }
    };


    const TransferHBAR = async (targetAccount: string, amount: number) => {
        try {
            const userAccountIdStr = signer.getAccountId().toString();
            const userAccountId = AccountId.fromString(userAccountIdStr);
            const adminAccountId = AccountId.fromString(targetAccount);
            const priceInHbar = new Hbar(amount);

            const transaction = await new TransferTransaction()
                .addHbarTransfer(userAccountId, priceInHbar.negated()) // Saldo user berkurang
                .addHbarTransfer(adminAccountId, priceInHbar)          // Saldo admin bertambah
                .freezeWithSigner(signer);

            const txResponse = await transaction.executeWithSigner(signer);
            
            const receipt = await txResponse.getReceiptWithSigner(signer);

            if (receipt.status.toString() === "SUCCESS") {
                return true;
            } 
            return false;
        } catch (error) {
            console.error("Transaction failed on client:", error);
            return false;
        }
    }

    return (
        <HashinalsContext.Provider 
            value={{
                connect,
                disconnect,
                TransferHBAR,
            }}
        >
            {children}
        </HashinalsContext.Provider>
    )
}

export const useHashinals = () => useContext(HashinalsContext);