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
    virtualApiKey: string;
}

interface TokenList {
    tokens: Token[];
}

interface Token {
    name: string;
    address: string;
    tokenAddress: string;
    daoAddress: string;
    tbaAddress: string
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
            apiKey: config.virtualApiKey,
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
    public async swapInSentientTokens(purchaseType: PurchaseType, tokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionReceipt> {
        const from = CONFIG.VIRTUALS_TOKEN_ADDR;
        const to = tokenAddress;

        // send transaction
        const txResponse = await this.transactionManager.sendSentientTransaction(PurchaseType.BUY, from, to, amount, builderID);

        // return transaction receipt
        return this.obtainReceipt(txResponse);
    }

    /**
     * Swap Prototype tokens to Virtuals 
     * @param tokenAddress Token swap to Virtuals
     * @param amount Amount to swap
     * @param builderID 
     */
    public async swapOutSentientTokens(purchaseType: PurchaseType, tokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionReceipt> {
        const from = tokenAddress;
        const to = CONFIG.VIRTUALS_TOKEN_ADDR;

        // send transaction
        const txResponse = await this.transactionManager.sendSentientTransaction(PurchaseType.SELL, from, to, amount, builderID);

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
        const txResponse = await this.transactionManager.sendPrototypeTransaction(PurchaseType.SELL, from, to, amount, builderID);

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
        const txResponse = await this.transactionManager.sendPrototypeTransaction(PurchaseType.BUY, from, to, amount, builderID);

        // return transaction receipt
        return this.obtainReceipt(txResponse);
    }

    /**
     * Obtain transaction receipt
     * @param txResponse ethers.TransactionResponse
     * @returns ethers.TransactionReceipt
     */
    private async obtainReceipt(txResponse: ethers.TransactionResponse): Promise<ethers.TransactionReceipt>{
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
}
