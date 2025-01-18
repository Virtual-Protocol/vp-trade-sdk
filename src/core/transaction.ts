import { ethers } from 'ethers';

export class TransactionManager {
    private wallet: ethers.Wallet;

    constructor(wallet: ethers.Wallet) {
        this.wallet = wallet;
    }

    /**
     * Create and sign a transaction.
     * @param to - The recipient address.
     * @param value - The amount of Ether to send.
     * @returns The signed transaction as a string.
     */
    private async createTransaction(request: ethers.TransactionRequest): Promise<string> {
    
        try {
            return await this.wallet.signTransaction(request);
        } catch (error) {
            throw new Error(`Failed to sign transaction: ${error}`);
        }
    }

    /**
     * Send a signed transaction to the blockchain.
     * @param signedTx - The signed transaction string.
     * @returns The transaction response.
     */
    public async sendTransaction(signedTx: string): Promise<ethers.TransactionResponse> {
        try {

            // Step 1: Build request based on prototype / sentient, and return TransactionRequest
            // Step 2: call createTransaction with the request
            // Step 3: call sendTransaction with the signedTx
            const provider = this.wallet.provider;
            if (!provider) {
                throw new Error('No provider found for the connected wallet');
            }
            const signedTx = await createTransaction(request);
            return await provider.broadcastTransaction(signedTx);
        } catch (error) {
            throw new Error(`Failed to send transaction: ${error}`);
        }
    }
}
