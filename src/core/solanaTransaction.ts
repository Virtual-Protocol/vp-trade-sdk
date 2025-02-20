import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import fetch from "cross-fetch";
import { Wallet } from "@project-serum/anchor";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createMemoInstruction } from "@solana/spl-memo";

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

export type GetQuoteConfig = {
  inputMint: string; // token to swap from
  outputMint: string; // token to swap to
  amount: number; // amount of token to swap
  slippageBps: number; // slippage in bps, e.g. 10 bps = 0.1%
  restrictIntermediateTokens?: boolean; // whether to restrict intermediate tokens
  maxRetry?: number; // max number of retries
  skipPreflight?: boolean; // whether to skip preflight
  lamportUnit?: number; // lamport unit, e.g. SOLANA and VIRTUAL are 1e9, agent tokens are 1e6
  jupiterConfig?: {
    prioritizationFeeLamports?: never;
    dynamicComputeUnitLimit?: boolean;
    dynamicSlippage?: boolean;
  };
};

type GetSerializedTransactionResponse = {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
  computeUnitLimit: number;
  prioritizationType: {
    computeBudget: { microLamports: number; estimatedMicroLamports: number };
  };
  simulationSlot: number;
  dynamicSlippageReport: {
    slippageBps: number;
    otherAmount: number;
    simulatedIncurredSlippageBps: number;
    amplificationRatio: number | null;
    categoryName: string;
    heuristicMaxSlippageBps: number;
    rtseSlippageBps: number;
  };
  simulationError?: {
    errorCode: string;
    error: string;
  };
  addressesByLookupTableAddress?: string[];
};

type RoutePlan = {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
};

type QuoteResponse = {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null;
  priceImpactPct: string;
  routePlan: [{ swapInfo: RoutePlan[]; percent: number }];
  scoreReport: null;
  contextSlot: number;
  timeTaken: number;
  swapUsdValue: string;
  simplerRouteUsed: boolean;
  error?: string;
};

export class SolanaTransactionManager {
  private connection: Connection;
  private wallet: Wallet;
  private jupiterApiKey?: string;

  constructor(
    walletPrivateKey: string,
    config?: {
      rpcUrl?: string;
      jupiterApiKey?: string;
    }
  ) {
    this.connection = new Connection(
      config?.rpcUrl || DEFAULT_RPC_URL,
      "finalized"
    );
    this.wallet = new Wallet(
      Keypair.fromSecretKey(bs58.decode(walletPrivateKey))
    );
    this.jupiterApiKey = config?.jupiterApiKey;
  }

  public async ensureTokenAccountExist(
    mintAddress: string,
    walletAddress: string
  ): Promise<PublicKey> {
    // ✅ 1. Get the Associated Token Account (ATA) address
    const ata = await getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      new PublicKey(walletAddress),
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // ✅ 2. Check if the ATA exists
    const accountInfo = await this.connection.getAccountInfo(ata);

    if (accountInfo) {
      return ata;
    }

    // 🚀 3. Create the ATA if it doesn't exist
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        this.wallet.payer.publicKey, // Payer (must be the signer)
        ata, // The ATA to create
        new PublicKey(walletAddress), // Owner of the ATA
        new PublicKey(mintAddress) // Token mint
      )
    );

    // ⏳ Send the transaction
    await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.wallet.payer],
      {
        commitment: "finalized",
      }
    );

    return ata;
  }

  public async getQuoteResponse(
    config: GetQuoteConfig
  ): Promise<QuoteResponse> {
    const url = `https://api.jup.ag/swap/v1/quote?inputMint=${config.inputMint
      }&outputMint=${config.outputMint}&amount=${config.amount * (config.lamportUnit ?? LAMPORTS_PER_SOL)
      }&slippageBps=${config.slippageBps}&restrictIntermediateTokens=${config.restrictIntermediateTokens ?? true
      }`;

    const headers = {
      "Content-Type": "application/json",
      ...(this.jupiterApiKey ? { "x-api-key": this.jupiterApiKey } : {}), // ✅ Clean conditional spread
    };

    const response = await fetch(url, { headers });
    const quoteResponse: QuoteResponse = await response.json();

    return quoteResponse;
  }

  public async getSerializedTransaction(
    quoteResponse: QuoteResponse,
    jupiterConfig?: {
      prioritizationFeeLamports?: never;
      dynamicComputeUnitLimit?: boolean;
      dynamicSlippage?: boolean;
    }
  ): Promise<GetSerializedTransactionResponse> {
    const headers = {
      "Content-Type": "application/json",
      ...(this.jupiterApiKey ? { "x-api-key": this.jupiterApiKey } : {}), // ✅ Clean conditional spread
    };

    const body = JSON.stringify({
      quoteResponse,
      userPublicKey: this.wallet.publicKey.toString(),
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 1000000,
          priorityLevel: "veryHigh",
        },
      },
      ...(jupiterConfig ?? {}),
    });

    const response = await fetch("https://api.jup.ag/swap/v1/swap", {
      method: "POST",
      headers,
      body,
    });

    const swapResponse: GetSerializedTransactionResponse =
      await response.json();

    return swapResponse;
  }

  public async transformTransaction(
    swapResponse: GetSerializedTransactionResponse,
    builderID?: number
  ): Promise<Uint8Array> {
    const transactionBase64 = swapResponse.swapTransaction;
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64")
    );

    // ✅ Add SPL Memo instruction if provided
    if (builderID !== undefined) {
      const memoInstruction: TransactionInstruction = createMemoInstruction(
        builderID.toString(),
        [this.wallet.payer.publicKey]
      );

      // 🌐 Resolve address lookup tables (ALT)
      if (transaction.message.addressTableLookups.length > 0) {

        const lookupTableAccounts: AddressLookupTableAccount[] = await Promise.all(
          transaction.message.addressTableLookups.map(async (lookup) => {
            const accountInfo = await this.connection.getAccountInfo(
              new PublicKey(lookup.accountKey)
            );

            if (!accountInfo) {
              throw new Error(`Address lookup table not found: ${lookup.accountKey}`);
            }

            return new AddressLookupTableAccount({
              key: new PublicKey(lookup.accountKey),
              state: AddressLookupTableAccount.deserialize(accountInfo.data),
            });
          })
        );

        // Decompile the message with resolved ALT
        const message = TransactionMessage.decompile(transaction.message, {
          addressLookupTableAccounts: lookupTableAccounts,
        });

        // ✅ Append the memo instruction
        message.instructions.push(memoInstruction);

        // 🔄 Recompile the message
        transaction.message = message.compileToV0Message(lookupTableAccounts);
      } else {
        // No address table lookups, proceed as normal
        const message = TransactionMessage.decompile(transaction.message);
        message.instructions.push(memoInstruction);
        transaction.message = message.compileToV0Message();
      }
    }

    // ✍️ Sign the updated transaction
    transaction.sign([this.wallet.payer]);

    // 🔄 Serialize and return
    return transaction.serialize();
  }

  public async swap(
    config: GetQuoteConfig,
    builderID?: number
  ): Promise<string> {
    // ensure token accounts exist
    await this.ensureTokenAccountExist(
      config.inputMint,
      this.wallet.publicKey.toString()
    );
    await this.ensureTokenAccountExist(
      config.outputMint,
      this.wallet.publicKey.toString()
    );
    const quoteResponse = await this.getQuoteResponse(config);
    if (quoteResponse?.error) {
      throw new Error(quoteResponse?.error ?? "");
    }
    const serializedTransaction = await this.getSerializedTransaction(
      quoteResponse,
      config?.jupiterConfig
    );
    if (serializedTransaction?.simulationError) {
      throw new Error(serializedTransaction?.simulationError?.error ?? "");
    }
    const transactionBinary = await this.transformTransaction(
      serializedTransaction,
      builderID
    );
    const signature = await this.connection.sendRawTransaction(
      transactionBinary,
      {
        maxRetries: config.maxRetry ?? 2,
        skipPreflight: config.skipPreflight ?? true,
      }
    );
    const confirmation = await this.connection.confirmTransaction(
      {
        signature: signature,
        blockhash: (await this.connection.getLatestBlockhash()).blockhash,
        lastValidBlockHeight: (
          await this.connection.getLatestBlockhash()
        ).lastValidBlockHeight,
      },
      "finalized"
    );

    if (confirmation.value.err) {
      throw new Error(
        `Transaction failed: ${JSON.stringify(
          confirmation.value.err
        )}\nhttps://solscan.io/tx/${signature}/`
      );
    }
    return signature;
  }
}
