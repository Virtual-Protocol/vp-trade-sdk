import { ethers } from 'ethers';
import { ProviderManager } from './core/provider';
import { TransactionManager } from './core/transaction';
import VirtualApiManager from './core/virtualProtocol';
import { WalletManager } from './core/wallet';

interface ClientConfig {
    privateKey: string;
    rpcUrl: string;
    apiKey: string;
    virtualApiUrl: string;
    virtualApiKey: string;
}

export class SDKClient {
    private transactionManager: TransactionManager;
    private virtualApiManager: VirtualApiManager;
    private wallet: WalletManager;

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
        this.transactionManager = new TransactionManager(this.wallet.getWallet(), provider.getProvider());

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
     * Send Ether to a recipient.
     * Combines createTransaction, sendTransaction, and waiting for the receipt.
     * @param value - The amount of Ether to send.
     * @returns The transaction receipt.
     */
    public async sendEther(value: ethers.BigNumberish): Promise<ethers.TransactionReceipt> {
        const tokenLists = await this.virtualApiManager.fetchTokenLists();
        const signedTx = await this.transactionManager.createTransaction(tokenLists.tokens[0].address, value);
        console.log('Signed transaction:', signedTx);

        const txResponse = await this.transactionManager.sendTransaction(signedTx);
        console.log('Transaction response:', txResponse);

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
