import { ethers } from 'ethers';

export class TransactionManager {
    private wallet: ethers.Wallet;
    private provider: ethers.JsonRpcProvider;

    constructor(wallet: ethers.Wallet, provider: ethers.JsonRpcProvider) {
        this.wallet = wallet;
        this.provider = provider;
    }

    /**
     * Create and sign a transaction.
     * @param to - The recipient address.
     * @param value - The amount of Ether to send.
     * @returns The signed transaction as a string.
     */
    public async createTransaction(to: string, value: ethers.BigNumberish): Promise<string> {
        if (!ethers.isAddress(to)) {
            throw new Error(`Invalid recipient address: ${to}`);
        }

        const connectedWallet = this.wallet.connect(this.provider);

        const tx: ethers.TransactionRequest = {
            to,
            value: ethers.parseEther(value.toString()),
            gasLimit: ethers.toBeHex(21000),
        };

        try {
            return await connectedWallet.signTransaction(tx);
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
            return await this.provider.broadcastTransaction(signedTx);
        } catch (error) {
            throw new Error(`Failed to send transaction: ${error}`);
        }
    }
}
