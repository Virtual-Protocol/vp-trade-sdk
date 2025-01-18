import { ethers } from 'ethers';
import { PurchaseType } from '../constant';
import { Prototype, Sentient } from './token';

export class TransactionManager {
    private wallet: ethers.Wallet;
    private prototype: Prototype;
    private sentient: Sentient;

    constructor(wallet: ethers.Wallet, prototype: Prototype, sentient: Sentient) {
        this.wallet = wallet;
        this.prototype = prototype;
        this.sentient = sentient;
    }

    /**
     * Create and sign a transaction.
     * @param request TransactionRequest
     * @returns The signed transaction as a string.
     */
    private async createTransaction(request: ethers.TransactionRequest): Promise<string> {

        try {
            return await this.wallet.signTransaction(request);
        } catch (error) {
            throw new Error(`Failed to sign transaction: ${error}`);
        }
    }

    public async sendPrototypeTransaction(purchaseType: PurchaseType, fromAddress: string, toAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionResponse> {
        try {

            // Step 1: Build request and return TransactionRequest
            let txnRequest: ethers.TransactionRequest;
            if (purchaseType == PurchaseType.BUY) {
                txnRequest = await this.prototype.buildBuyPrototypeTokenRequest(toAddress, amount, builderID);
            } else if (purchaseType == PurchaseType.SELL) {
                txnRequest = await this.prototype.buildSellPrototypeTokenRequest(fromAddress, amount, builderID);
            } else {
                throw new Error(`Failed to send transaction, unknown tokenType : ${purchaseType}`);
            }

            // Step 2: call createTransaction with the request
            const signedTx = await this.createTransaction(txnRequest);

            // Step 3: call sendTransaction with the signedTx
            const provider = this.wallet.provider;
            if (!provider) {
                throw new Error('No provider found for the connected wallet');
            }

            return await provider.broadcastTransaction(signedTx);
        } catch (error) {
            throw new Error(`Failed to send transaction: ${error}`);
        }
    }

    public async sendSentientTransaction(purchaseType: PurchaseType, fromAddress: string, toAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionResponse> {
        try {

            // Step 1: Build request and return TransactionRequest
            const txnRequest = await this.sentient.swapSentientToken(fromAddress, toAddress, amount, builderID);

            // Step 2: call createTransaction with the request
            const signedTx = await this.createTransaction(txnRequest);

            // Step 3: call sendTransaction with the signedTx
            const provider = this.wallet.provider;
            if (!provider) {
                throw new Error('No provider found for the connected wallet');
            }

            return await provider.broadcastTransaction(signedTx);
        } catch (error) {
            throw new Error(`Failed to send transaction: ${error}`);
        }
    }
}
