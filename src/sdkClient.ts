import { ethers } from "ethers";
import { ProviderManager } from "./core/provider";
import { TransactionManager } from "./core/transaction";
import VirtualApiManager, {
  GetKlinesParams,
  GetLatestTradesParams,
  KLine,
  Trade,
} from "./core/virtualProtocol";
import { WalletManager } from "./core/wallet";
import { AGENT_CHAIN_ID, CONFIG, PurchaseType, TokenType } from "./constant";
import { Prototype, Sentient } from "./core/token";

export interface ClientConfig {
  privateKey: string;
  rpcUrl: string;
  rpcApiKey: string;
  virtualApiUrl: string;
  virtualApiUrlV2: string;
}

export interface TokenList {
  tokens: Token[];
}

export interface Option {
  builderID?: number;
  slippage?: number;
}

export interface Token {
  id: number; // Represents the unique identifier of the token
  name: string; // Name of the token
  status: string; // Status of the token (e.g., "AVAILABLE")
  tokenAddress: string; // The address of the token
  description: string; // A brief description of the token
  lpAddress: string; // Liquidity pool address for the token
  symbol: string; // Symbol of the token (e.g., "LUNA")
  holderCount: number; // Number of holders of the token
  mcapInVirtual: number; // Market cap in virtual (e.g., in USD or other virtual currency)
  socials: {
    VERIFIED_LINKS: {
      TWITTER: string; // Verified Twitter link
      TELEGRAM: string; // Verified Telegram link
    };
  };
  image: {
    id: number; // ID of the image resource
    url: string; // URL of the image (e.g., the token's logo)
  };
  chain: string; // Chain of the token
}

export class SDKClient {
  private transactionManager: TransactionManager;
  private virtualApiManager: VirtualApiManager;
  private wallet: WalletManager;
  private prototype: Prototype;
  private sentient: Sentient;

  constructor(config: ClientConfig) {
    if (!config.privateKey || !this.isValidPrivateKey(config.privateKey)) {
      throw new Error("Invalid private key provided.");
    }

    // Validate the RPC URL
    if (!config.rpcUrl || !this.isValidRpcUrl(config.rpcUrl)) {
      throw new Error("Invalid RPC URL provided.");
    }
    // Validate the private key
    const provider = ProviderManager.getInstance({
      rpcUrl: config.rpcUrl,
      rpcApiKey: config.rpcApiKey,
    });
    this.wallet = WalletManager.getInstance({
      privateKey: config.privateKey,
      provider: provider.getProvider(),
    });
    this.virtualApiManager = new VirtualApiManager({
      apiUrl: config.virtualApiUrl,
      apiUrlV2: config.virtualApiUrlV2,
    });
    this.prototype = new Prototype(
      this.wallet.getWallet(),
      CONFIG.VIRTUALS_TOKEN_ADDR,
      CONFIG.VIRTUAL_ROUTER_ADDR,
      CONFIG.BONDING_CURVE_ADDR
    );
    this.sentient = new Sentient(
      this.wallet.getWallet(),
      CONFIG.UNISWAP_V2_ROUTER_ADDR
    );
    this.transactionManager = new TransactionManager(
      this.wallet.getWallet(),
      this.prototype,
      this.sentient
    );
  }

  /**
   * Get the wallet's address.
   */
  public getAddress(): string {
    return this.wallet.getWallet().address;
  }

  /**
   * Sign a message using the wallet's private key.
   * @param message - The message to sign
   */
  public async signMessage(message: string): Promise<string> {
    return this.wallet.getWallet().signMessage(message);
  }

  /**
   * Buy Sentient tokens from Virtuals
   * @param tokenAddress Sentient Token buy from Virtuals
   * @param amount Amount of Virtuals to buy Sentient tokens
   * @param builderID
   * @returns ethers.TransactionReceipt
   */
  public async buySentientTokens(
    tokenAddress: string,
    amount: string,
    builderID?: number
  ): Promise<ethers.TransactionReceipt> {
    const from = CONFIG.VIRTUALS_TOKEN_ADDR;
    const to = tokenAddress;

    // send transaction
    const txResponse = await this.transactionManager.sendSentientTransaction(
      from,
      to,
      amount,
      { builderID }
    );

    // return transaction receipt
    return this.obtainReceipt(txResponse);
  }

  /**
   * Sell Sentient tokens to Virtuals
   * @param tokenAddress Sentient token to sell to Virtuals
   * @param amount Amount of Sentient tokens to sell
   * @param builderID
   * @returns ethers.TransactionReceipt
   */
  public async sellSentientTokens(
    tokenAddress: string,
    amount: string,
    builderID?: number
  ): Promise<ethers.TransactionReceipt> {
    const from = tokenAddress;
    const to = CONFIG.VIRTUALS_TOKEN_ADDR;

    // send transaction
    const txResponse = await this.transactionManager.sendSentientTransaction(
      from,
      to,
      amount,
      { builderID }
    );

    // return transaction receipt
    return this.obtainReceipt(txResponse);
  }

  /**
   * Buy Prototype tokens from Virtuals
   * @param tokenAddress Prototype Token buy from Virtuals
   * @param amount Amount of Virtuals to buy Prototype tokens
   * @param builderID
   * @returns ethers.TransactionReceipt
   */
  public async buyPrototypeTokens(
    tokenAddress: string,
    amount: string,
    option?: Option
  ): Promise<ethers.TransactionReceipt> {
    const from = CONFIG.VIRTUALS_TOKEN_ADDR;
    const to = tokenAddress;

    // send transaction
    const txResponse = await this.transactionManager.sendPrototypeTransaction(
      PurchaseType.BUY,
      from,
      to,
      amount,
      option
    );

    // return transaction receipt
    return this.obtainReceipt(txResponse);
  }

  /**
   * Sell Prototype tokens to Virtuals
   * @param tokenAddress Prototype Token sell to Virtuals
   * @param amount Amount of Prototype tokens to sell
   * @param builderID
   * @returns ethers.TransactionReceipt
   */
  public async sellPrototypeTokens(
    tokenAddress: string,
    amount: string,
    option?: Option
  ): Promise<ethers.TransactionReceipt> {
    const from = tokenAddress;
    const to = CONFIG.VIRTUALS_TOKEN_ADDR;

    // send transaction
    const txResponse = await this.transactionManager.sendPrototypeTransaction(
      PurchaseType.SELL,
      from,
      to,
      amount,
      option
    );

    // return transaction receipt
    return this.obtainReceipt(txResponse);
  }

  /**
   * Checks the allowance for Sentient Tokens before performing a buy or sell operation.
   * @param amount - The amount of Virtual Tokens for buying Sentient Tokens or the amount of Sentient Tokens for selling.
   * @param fromTokenAddress (optional) - The address of the Sentient Token to sell. Defaults to the Virtual Token address when buying.
   * @returns A boolean indicating whether the allowance is sufficient.
   */
  public async checkSentientAllowance(
    amount: string,
    fromTokenAddress?: string
  ): Promise<boolean> {
    return await this.transactionManager.checkSentientAllowance(
      amount,
      fromTokenAddress ? fromTokenAddress : CONFIG.VIRTUALS_TOKEN_ADDR
    );
  }

  /**
   * Approve Sentient Token Allowance before buying / selling Sentient tokens
   * @param amount - The amount of Virtual Tokens for buying Sentient Tokens or the amount of Sentient Tokens for selling.
   * @param fromTokenAddress <Optional> fromTokenAddress - Pass in Sentient Token Address for selling sentient tokens, default is Virtuals Token Address (during buying)
   * @returns A string of hash of the approved transaction receipt
   */
  public async approveSentientAllowance(
    amount: string,
    fromTokenAddress?: string
  ): Promise<string> {
    return await this.transactionManager.approveSentientAllowance(
      amount,
      fromTokenAddress ? fromTokenAddress : CONFIG.VIRTUALS_TOKEN_ADDR
    );
  }

  /**
   * Checks the allowance for Prototype Tokens before performing a buy or sell operation.
   * @param amount - The amount of Virtual Tokens for buying Prototype Tokens or the amount of Prototype Tokens for selling.
   * @param fromTokenAddress (optional) - The address of the Sentient Token to sell. Defaults to the Virtual Token address when buying.
   * @returns A boolean indicating whether the allowance is sufficient.
   */
  public async checkPrototypeAllowance(
    amount: string,
    fromTokenAddress?: string
  ): Promise<boolean> {
    return await this.transactionManager.checkPrototypeAllowance(
      amount,
      fromTokenAddress ? fromTokenAddress : CONFIG.VIRTUALS_TOKEN_ADDR
    );
  }

  /**
   * Approve Prototype Token Allowance before buying / selling Prototype tokens
   * @param amount - The amount of Virtual Tokens for buying Prototype Tokens or the amount of Prototype Tokens for selling.
   * @param fromTokenAddress (optional) - The address of the Sentient Token to sell. Defaults to the Virtual Token address when buying.
   * @returns A string of hash of the approved transaction receipt
   */
  public async approvePrototypeAllowance(
    amount: string,
    fromTokenAddress?: string
  ): Promise<string> {
    return await this.transactionManager.approvePrototypeAllowance(
      amount,
      fromTokenAddress ? fromTokenAddress : CONFIG.VIRTUALS_TOKEN_ADDR
    );
  }

  /**
   * Get a List of Sentient Tokens sorted by highest total value locked
   * @param pageNumber Page number for pagination, default value is 1
   * @param pageSize Page size for pagination, default value is 30
   * @param agentChainId Chain ID of the agent, default value is AGENT_CHAIN_ID.ALL
   * @returns Token list data
   */
  public async getSentientListing(
    pageNumber: number = 1,
    pageSize: number = 30,
    agentChainId: AGENT_CHAIN_ID = AGENT_CHAIN_ID.ALL
  ): Promise<TokenList> {
    return await this.virtualApiManager.fetchVirtualTokenLists(
      TokenType.SENTIENT,
      agentChainId,
      pageNumber,
      pageSize
    );
  }

  /**
   * Get a List of Prototype Tokens sorted by highest total value locked
   * @param pageNumber Page number for pagination, default value is 1
   * @param pageSize Page size for pagination, default value is 30
   * @param agentChainId Chain ID of the agent, default value is AGENT_CHAIN_ID.ALL
   * @returns Token list data
   */
  public async getPrototypeListing(
    pageNumber: number = 1,
    pageSize: number = 30,
    agentChainId: AGENT_CHAIN_ID = AGENT_CHAIN_ID.ALL
  ): Promise<TokenList> {
    return await this.virtualApiManager.fetchVirtualTokenLists(
      TokenType.PROTOTYPE,
      agentChainId,
      pageNumber,
      pageSize
    );
  }

  /**
   * Get a List of Prototype or Sentient Tokens by Token Address
   * @param tokenAddress Token's address
   * @returns Token list data
   */
  public async searchVirtualTokensByKeyword(keyword: string): Promise<Token> {
    return await this.virtualApiManager.searchVirtualTokensByKeyword(keyword);
  }

  /**
   * Fetch K-line (candlestick) data for a specific token
   * @param params Parameters for the K-line data request
   * @returns Array of KLine data
   */
  public async fetchKlines(params: GetKlinesParams): Promise<KLine[]> {
    return this.virtualApiManager.fetchKlines(params);
  }

  /**
   * Fetch latest trades for a specific token
   * @param params Parameters for the latest trades data request
   * @returns Array of Trade data
   */
  public async fetchLatestTrades(
    params: GetLatestTradesParams
  ): Promise<Trade[]> {
    return this.virtualApiManager.fetchLatestTrades(params);
  }

  /**
   * Validate a private key.
   * @param privateKey - The private key to validate
   */
  private isValidPrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate an RPC URL.
   * @param rpcUrl - The RPC URL to validate
   */
  private isValidRpcUrl(rpcUrl: string): boolean {
    // Basic validation: check if it's a valid URL
    try {
      new URL(rpcUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtain transaction receipt
   * @param txResponse ethers.TransactionResponse
   * @returns ethers.TransactionReceipt
   */
  private async obtainReceipt(
    txResponse: ethers.TransactionResponse
  ): Promise<ethers.TransactionReceipt> {
    try {
      const txReceipt = await txResponse.wait();

      if (!txReceipt) {
        throw new Error("Transaction receipt is null.");
      }

      console.log("Transaction receipt:", txReceipt);
      return txReceipt;
    } catch (error) {
      throw new Error(`Failed to wait for transaction receipt: ${error}`);
    }
  }
}

// Also export these types from SDKClient for external use
export type { GetKlinesParams, KLine };
