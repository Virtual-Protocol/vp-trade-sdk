import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
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
    prioritizationFeeLamports?: any;
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
    // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
    const quoteResponse: QuoteResponse = await (
      await fetch(
        `https://api.jup.ag/swap/v1/quote?inputMint=${
          config.inputMint
        }&outputMint=${config.outputMint}&amount=${
          config.amount * (config.lamportUnit ?? LAMPORTS_PER_SOL)
        }&slippageBps=${config.slippageBps}&restrictIntermediateTokens=${
          config.restrictIntermediateTokens ?? true
        }`,
        {
          headers: !!this.jupiterApiKey
            ? {
                "Content-Type": "application/json",
                "x-api-key": this.jupiterApiKey,
              }
            : {
                "Content-Type": "application/json",
              },
        }
      )
    ).json();
    return quoteResponse;
  }

  public async getSerializedTransaction(
    quoteResponse: QuoteResponse,
    jupiterConfig?: {
      prioritizationFeeLamports?: any;
      dynamicComputeUnitLimit?: boolean;
      dynamicSlippage?: boolean;
    }
  ): Promise<GetSerializedTransactionResponse> {
    const swapResponse = await (
      await fetch("https://api.jup.ag/swap/v1/swap", {
        method: "POST",
        headers: !!this.jupiterApiKey
          ? {
              "Content-Type": "application/json",
              "x-api-key": this.jupiterApiKey,
            }
          : {
              "Content-Type": "application/json",
            },
        body: JSON.stringify({
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
        }),
      })
    ).json();

    return swapResponse;
  }

  public transformTransaction(
    swapResponse: GetSerializedTransactionResponse
  ): Uint8Array {
    const transactionBase64 = swapResponse.swapTransaction;
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64")
    );

    transaction.sign([this.wallet.payer]);

    const transactionBinary = transaction.serialize();

    return transactionBinary;
  }

  public async swap(config: GetQuoteConfig): Promise<string> {
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
    const transactionBinary = this.transformTransaction(serializedTransaction);
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
