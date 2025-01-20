import { ethers, parseEther } from 'ethers';
import { bondingAbi } from '../../assets/bonding';
import { frouterAbi } from '../../assets/frouter';
import { PurchaseType } from '../../constant';
import { TokenBase } from './tokenbase'

export class Prototype extends TokenBase {
    private virtualsTokenAddr: string;
    private virtualRouter: string;
    private bondingCurveAddr: string;

    constructor(wallet: ethers.Wallet, virtualsTokenAddr: string, virtualRouter: string, bondingCurveAddr: string) {
        super(wallet);
        this.virtualsTokenAddr = virtualsTokenAddr;
        this.virtualRouter = virtualRouter;
        this.bondingCurveAddr = bondingCurveAddr;
    }

    public async buildBuyPrototypeTokenRequest(prototypeTokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }

        // estimate how many of prototype token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.BUY, amount, prototypeTokenAddress);
        console.log(`Estimated to receive of prototype token: ${prototypeTokenAddress} amount: ${quoteAmt}`);

        const amountInWei = parseEther(amount);
        // check allowance
        await this.checkTokenAllowance(amountInWei.toString());

        // ABI-encoded `buy` function call
        const abi = bondingAbi;
        const iface = new ethers.Interface(abi);
        let data = iface.encodeFunctionData(PurchaseType.BUY.toLowerCase(), [amountInWei, prototypeTokenAddress]);

        // Append builderID if provided
        if (!builderID && builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(builderID), 2); // Encode builderID as 2-byte hex
            data += builderIDHex.slice(2); // Remove '0x' from builderIDHex and append
        }

        // Build the transaction
        let tx: ethers.TransactionRequest = {
            from: this.wallet.address,
            to: this.bondingCurveAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        }
        tx = await this.estimateGas(tx);

        return tx;

    }

    public async buildSellPrototypeTokenRequest(prototypeTokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }

        // estimate how many of virtuals token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.SELL, amount, prototypeTokenAddress);
        console.log('Estimated to receive amount of virtuals: ', quoteAmt);

        const amountInWei = parseEther(amount);

        // check allowance
        await this.checkTokenAllowance(amountInWei.toString(), prototypeTokenAddress);

        // ABI-encoded `sell` function call
        const abi = bondingAbi;
        const iface = new ethers.Interface(abi);
        let data = iface.encodeFunctionData(PurchaseType.SELL.toLowerCase(), [amountInWei, prototypeTokenAddress]);

        // Append builderID if provided
        if (!builderID && builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(builderID), 2); // Encode builderID as 2-byte hex
            data += builderIDHex.slice(2); // Remove '0x' from builderIDHex and append
        }

        // Build the transaction
        let tx: ethers.TransactionRequest = {
            from: this.wallet.address,
            to: this.bondingCurveAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        }
        tx = await this.estimateGas(tx);

        return tx;
    }

    private async checkTokenAllowance(amountInWei: string, prototypeTokenAddress?: string) {
        // Use the provided prototype token address or fallback to the default virtuals token address.
        const tokenAddress = prototypeTokenAddress ? prototypeTokenAddress : this.virtualsTokenAddr;
        await this.checkAllowanceAndApprove(amountInWei, tokenAddress, this.virtualRouter);
    }

    public async getQuote(side: PurchaseType, amount: string, prototypeTokenAddress: string): Promise<string> {
        const tax = 0.99;

        console.log('getQuote')

        const frouterContract: ethers.Contract = new ethers.Contract(this.virtualRouter, frouterAbi, this.wallet);
        if (side === PurchaseType.BUY) {
            const amountAfterDeductingTax = +amount * tax;
            return await frouterContract.getAmountsOut(prototypeTokenAddress, this.virtualsTokenAddr, parseEther(amountAfterDeductingTax.toString()));
        } else {
            // for sell prototype token to get virtuals, asset token use zero address.
            return await frouterContract.getAmountsOut(prototypeTokenAddress, '0x0000000000000000000000000000000000000000', parseEther(amount.toString()));
        }
    }
}
