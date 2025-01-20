import { ethers } from 'ethers';
import { ProviderManager } from './core/provider';
import { TransactionManager } from './core/transaction';
import VirtualApiManager from './core/virtualProtocol';
import { WalletManager } from './core/wallet';
import { CONFIG, PurchaseType, TokenType } from './constant';
import { Prototype, Sentient } from './core/token';

interface ClientConfig {
    privateKey: string;
    rpcUrl: string;
    apiKey: string;
    virtualApiUrl: string;
}

interface TokenList {
    tokens: Token[];
}

interface Token {
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
        x: string; // Link to the token's social media (e.g., Twitter handle)
        TWITTER: string; // Verified Twitter link
        VERIFIED_LINKS: {
            TWITTER: string; // Verified Twitter link
        };
    };
    image: {
        id: number; // ID of the image resource
        url: string; // URL of the image (e.g., the token's logo)
    };
}

export class SDKClient {
    private transactionManager: TransactionManager;
    private virtualApiManager: VirtualApiManager;
    private wallet: WalletManager;
    private prototype: Prototype;
    private sentient: Sentient;

    constructor(config: ClientConfig) {

        if (!config.privateKey || !this.isValidPrivateKey(config.privateKey)) {
            throw new Error('Invalid private key provided.');
        }

        // Validate the RPC URL
        if (!config.rpcUrl || !this.isValidRpcUrl(config.rpcUrl)) {
            throw new Error('Invalid RPC URL provided.');
        }
        // Validate the private key
        const provider = ProviderManager.getInstance({
            rpcUrl: config.rpcUrl,
            apiKey: config.apiKey,
        });
        this.wallet = WalletManager.getInstance({
            privateKey: config.privateKey,
            provider: provider.getProvider(),
        });
        this.virtualApiManager = new VirtualApiManager({
            apiUrl: config.virtualApiUrl
        });
        this.prototype = new Prototype(this.wallet.getWallet(), CONFIG.VIRTUALS_TOKEN_ADDR, CONFIG.VIRTUAL_ROUTER_ADDR, CONFIG.BONDING_CURVE_ADDR);
        this.sentient = new Sentient(this.wallet.getWallet(), CONFIG.UNISWAP_V2_ROUTER_ADDR)
        this.transactionManager = new TransactionManager(this.wallet.getWallet(), this.prototype, this.sentient);

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
     * Swap Prototype tokens from Virtuals 
     * @param tokenAddress Token swap from Virtuals
     * @param amount Amount to swap
     * @param builderID 
     */
    public async swapInSentientTokens(tokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionReceipt> {
        const from = CONFIG.VIRTUALS_TOKEN_ADDR;
        const to = tokenAddress;

        // send transaction
        const txResponse = await this.transactionManager.sendSentientTransaction(from, to, amount, builderID);

        // return transaction receipt
        return this.obtainReceipt(txResponse);
    }

    /**
     * Swap Prototype tokens to Virtuals 
     * @param tokenAddress Token swap to Virtuals
     * @param amount Amount to swap
     * @param builderID 
     */
    public async swapOutSentientTokens(tokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionReceipt> {
        const from = tokenAddress;
        const to = CONFIG.VIRTUALS_TOKEN_ADDR;

        // send transaction
        const txResponse = await this.transactionManager.sendSentientTransaction(from, to, amount, builderID);

        // return transaction receipt
        return this.obtainReceipt(txResponse);
    }

    /**
     * Buy Prototype tokens from Virtuals 
     * @param tokenAddress Token buy from Virtuals
     * @param amount Amount to buy
     * @param builderID 
     */
    public async buyPrototypeTokens(tokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionReceipt> {
        const from = CONFIG.VIRTUALS_TOKEN_ADDR;
        const to = tokenAddress;

        // send transaction
        const txResponse = await this.transactionManager.sendPrototypeTransaction(PurchaseType.BUY, from, to, amount, builderID);

        // return transaction receipt
        return this.obtainReceipt(txResponse);
    }

    /**
     * Sell Prototype tokenes to Virtuals
     * @param tokenAddress Token sell to Virtuals
     * @param amount Amount to sell
     * @param builderID 
     * @returns 
     */
    public async sellPrototypeTokens(tokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionReceipt> {
        const from = tokenAddress;
        const to = CONFIG.VIRTUALS_TOKEN_ADDR;

        // send transaction
        const txResponse = await this.transactionManager.sendPrototypeTransaction(PurchaseType.SELL, from, to, amount, builderID);

        // return transaction receipt
        return this.obtainReceipt(txResponse);
    }

    /**
     * Get a List of Sentinent Tokens
     * @param pageNumber Page number for pagination
     * @param pageSize Page size for pagination
     * @returns Token list data
     */
    public async getSentinentListing(pageNumber: number = 1, pageSize: number = 30): Promise<TokenList> {
        return await this.virtualApiManager.fetchVirtualTokenLists(TokenType.SENTIENT, pageNumber, pageSize);
    }

    /**
     * Get a List of Prototype Tokens
     * @param pageNumber Page number for pagination
     * @param pageSize Page size for pagination
     * @returns Token list data
     */
    public async getPrototypeListing(pageNumber: number = 1, pageSize: number = 30): Promise<TokenList> {
        return await this.virtualApiManager.fetchVirtualTokenLists(TokenType.PROTOTYPE, pageNumber, pageSize);
    }

    /**
     * Get a List of Prototype or Sentient Tokens by Token Address
     * @param tokenAddress Token's address
     * @returns Token list data
     */
    public async fetchToken(tokenAddress: string): Promise<Token> {
        return await this.virtualApiManager.fetchVirtualTokensByAddress(tokenAddress);
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
    private async obtainReceipt(txResponse: ethers.TransactionResponse): Promise<ethers.TransactionReceipt> {
        try {
            const txReceipt = await txResponse.wait();

            if (!txReceipt) {
                throw new Error('Transaction receipt is null.');
            }

            console.log('Transaction receipt:', txReceipt);
            return txReceipt;
        } catch (error) {
            throw new Error(`Failed to wait for transaction receipt: ${error}`);
        }
    }
}
