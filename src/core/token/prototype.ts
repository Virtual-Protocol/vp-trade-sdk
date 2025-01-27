import { ethers, parseEther } from 'ethers';
import { bondingAbi } from '../../assets/bonding';
import { frouterAbi } from '../../assets/frouter';
import { PurchaseType, CONFIG } from '../../constant';
import { TokenBase } from './tokenbase'
import { Option } from '../../sdkClient';

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

    public async buildBuyPrototypeTokenRequest(prototypeTokenAddress: string, amount: string, option?: Option): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }

        // estimate how many of prototype token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.BUY, amount, prototypeTokenAddress);
        console.log(`Estimated to receive of prototype token: ${prototypeTokenAddress} amount: ${quoteAmt}`);

        const amountInWei = parseEther(amount);

        // Notes: removed, this should be responsibility on builder.
        // check allowance
        // await this.checkTokenAllowance(amountInWei.toString());

        // ABI-encoded `buy` function call
        const abi = bondingAbi;
        const iface = new ethers.Interface(abi);
        let data = iface.encodeFunctionData(PurchaseType.BUY.toLowerCase(), [amountInWei, prototypeTokenAddress]);

        // Append builderID if provided
        if (option && !option.builderID && option.builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(option.builderID), 2); // Encode builderID as 2-byte hex
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

    public async buildSellPrototypeTokenRequest(prototypeTokenAddress: string, amount: string, option?: Option): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }

        // estimate how many of virtuals token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.SELL, amount, prototypeTokenAddress);
        console.log('Estimated to receive amount of virtuals: ', quoteAmt);

        const amountInWei = parseEther(amount);

        // Notes: removed, this should be responsibility on builder.
        // check allowance
        // await this.checkTokenAllowance(amountInWei.toString(), prototypeTokenAddress);

        // ABI-encoded `sell` function call
        const abi = bondingAbi;
        const iface = new ethers.Interface(abi);
        let data = iface.encodeFunctionData(PurchaseType.SELL.toLowerCase(), [amountInWei, prototypeTokenAddress]);

        // Append builderID if provided
        if (option && !option.builderID && option.builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(option.builderID), 2); // Encode builderID as 2-byte hex
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

    public async checkTokenAllowance(amount: string, prototypeTokenAddress?: string) {
        // Use the provided prototype token address or fallback to the default virtuals token address.
        const tokenAddress = prototypeTokenAddress ? prototypeTokenAddress : this.virtualsTokenAddr;
        return await this.checkAllowance(amount, tokenAddress, this.virtualRouter);
    }

    public async approveTokenAllowance(amount: string, prototypeTokenAddress?: string) {
        // Use the provided prototype token address or fallback to the default virtuals token address.
        const tokenAddress = prototypeTokenAddress ? prototypeTokenAddress : this.virtualsTokenAddr;
        return await this.approveAllowance(amount, tokenAddress, this.virtualRouter);
    }

    public async getQuote(side: PurchaseType, amount: string, prototypeTokenAddress: string): Promise<string> {
        //Specifies the rate remaining after applying tax.
        const taxRate = CONFIG.TAX_RATE; // e.g. 1% tax rate
        const afterTaxRate = 1 - taxRate; // e.g. 99% of the original amount remains after applying a 1% tax.

        const frouterContract: ethers.Contract = new ethers.Contract(this.virtualRouter, frouterAbi, this.wallet);
        if (side === PurchaseType.BUY) {
            const amountAfterDeductingTax = +amount * afterTaxRate;
            return await frouterContract.getAmountsOut(prototypeTokenAddress, this.virtualsTokenAddr, parseEther(amountAfterDeductingTax.toString()));
        } else {
            // for sell prototype token to get virtuals, asset token use zero address.
            return await frouterContract.getAmountsOut(prototypeTokenAddress, '0x0000000000000000000000000000000000000000', parseEther(amount.toString()));
        }
    }
}
