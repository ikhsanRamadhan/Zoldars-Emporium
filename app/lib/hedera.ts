import {
  Client,
  TransferTransaction,
  AccountId,
  PrivateKey,
  Hbar,
} from "@hashgraph/sdk";

function getClient(): Client {
  const accountId = process.env.HEDERA_ACCOUNT_ID
  const privateKey = process.env.HEDERA_PRIVATE_KEY
  const network = process.env.HEDERA_NETWORK || "testnet"

  if (!accountId || !privateKey) {
    throw new Error(
      "HEDERA_ACCOUNT_ID dan HEDERA_PRIVATE_KEY wajib diset di .env.local"
    )
  }

  const client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet()

  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromString(privateKey)
  )

  return client
}

export interface TransferResult {
  success: boolean
  transactionId: string
  explorerUrl: string
  error?: string
}

export async function transferHbar(
  toAccountId: string,
  amountHbar: number,
  memo: string
): Promise<TransferResult> {
  try {
    const client = getClient()

    const tx = await new TransferTransaction()
      .addHbarTransfer(
        AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
        new Hbar(-amountHbar)
      )
      .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amountHbar))
      .setTransactionMemo(memo)
      .execute(client)

    const receipt = await tx.getReceipt(client)

    const txId = tx.transactionId.toString()

    return {
      success: receipt.status.toString() === "SUCCESS",
      transactionId: txId,
      explorerUrl: `https://hashscan.io/testnet/transaction/${txId}`,
    }
  } catch (error) {
    return {
      success: false,
      transactionId: "",
      explorerUrl: "",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
