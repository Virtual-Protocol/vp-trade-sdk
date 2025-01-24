import { ethers } from 'ethers';
import { PurchaseType } from '../constant';
import { Prototype, Sentient } from './token';
import { Option } from '../sdkClient';

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
     * Sends a transaction for prototype tokens (either purchase or sale).
     * 
     * This method builds the transaction request for buying or selling prototype tokens,
     * signs the transaction, and broadcasts it to the network. The `purchaseType` determines
     * whether the transaction is a buy or a sell operation.  
     * 
     * @param purchaseType - Type of purchase: either `PurchaseType.BUY` or `PurchaseType.SELL`.
     * @param fromAddress - Address of the token sender (for sell operations).
     * @param toAddress - Address of the recipient (for buy operations).
     * @param amount - Amount of the token to be bought or sold, represented as a string.
     * @param option - Optional parameters for the transaction.
     * @returns A promise that resolves to the transaction response (`ethers.TransactionResponse`).
     */
    public async sendPrototypeTransaction(purchaseType: PurchaseType, fromAddress: string, toAddress: string, amount: string, option?: Option): Promise<ethers.TransactionResponse> {
        try {

            // Validate provider
            const provider = this.wallet.provider;
            if (!provider) {
                throw new Error('No provider found for the connected wallet');
            }

            // Step 1: Build request and return TransactionRequest
            let txnRequest: ethers.TransactionRequest;
            if (purchaseType == PurchaseType.BUY) {
                txnRequest = await this.prototype.buildBuyPrototypeTokenRequest(toAddress, amount, option);
            } else if (purchaseType == PurchaseType.SELL) {
                txnRequest = await this.prototype.buildSellPrototypeTokenRequest(fromAddress, amount, option);
            } else {
                throw new Error(`Failed to send transaction, unknown tokenType : ${purchaseType}`);
            }

            // Step 2: call createTransaction with the request
            const signedTx = await this.createTransaction(txnRequest);

            // Step 3: call sendTransaction with the signedTx
            return await provider.broadcastTransaction(signedTx);
        } catch (error) {
            throw new Error(`Failed to send transaction: ${error}`);
        }
    }

    
    public async checkPrototypeAllowance(amountInWei: string, fromTokenAddress: string): Promise<boolean> {
        try {
            return await this.prototype.checkTokenAllowance(amountInWei, fromTokenAddress);
        } catch (error) {
            throw new Error(`Failed to check prototype allowance: ${error}`);
        }
    }

    public async approvePrototypeAllowance(amountInWei: string, fromTokenAddress: string): Promise<string> {
        try {
            return await this.prototype.approveTokenAllowance(amountInWei, fromTokenAddress);
        } catch (error) {
            throw new Error(`Failed to approve prototype allowance: ${error}`);
        }
    }

    /**
     * Sends a transaction for sentient tokens (either purchase or sale).
     * 
     * This method builds the transaction request for buying or selling sentient tokens,
     * signs the transaction, and broadcasts it to the network. The `purchaseType` determines
     * whether the transaction is a buy or a sell operation.  
     * 
     * @param fromAddress - Address of the token sender (for sell operations).
     * @param toAddress - Address of the recipient (for buy operations).
     * @param amount - Amount of the token to be bought or sold, represented as a string.
     * @param option - Optional parameters for the transaction.
     * @returns A promise that resolves to the transaction response (`ethers.TransactionResponse`).
     */
    public async sendSentientTransaction(fromAddress: string, toAddress: string, amount: string, option?: Option): Promise<ethers.TransactionResponse> {
        try {

            // Validate provider
            const provider = this.wallet.provider;
            if (!provider) {
                throw new Error('No provider found for the connected wallet');
            }

            // Step 1: Build request and return TransactionRequest
            const txnRequest = await this.sentient.swapSentientToken(fromAddress, toAddress, amount, option);

            // Step 2: call createTransaction with the request
            const signedTx = await this.createTransaction(txnRequest);

            // Step 3: call sendTransaction with the signedTx
            return await provider.broadcastTransaction(signedTx);
        } catch (error) {
            throw new Error(`Failed to send transaction: ${error}`);
        }
    }

    public async checkSentientAllowance(amountInWei: string, fromTokenAddress: string): Promise<boolean> {
        try {
            return await this.sentient.checkTokenAllowance(amountInWei, fromTokenAddress);
        } catch (error) {
            throw new Error(`Failed to check sentient allowance: ${error}`);
        }
    }

    public async approveSentientAllowance(amountInWei: string, fromTokenAddress: string): Promise<string> {
        try {
            return await this.sentient.approveTokenAllowance(amountInWei, fromTokenAddress);
        } catch (error) {
            throw new Error(`Failed to approve sentient allowance: ${error}`);
        }
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
}
