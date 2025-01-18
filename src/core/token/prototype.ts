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

        // const bondingCurveAddr = '0xF66DeA7b3e897cD44A5a231c61B6B4423d613259';

        // estimate how many of prototype token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.BUY, amount, prototypeTokenAddress);
        console.log(`Estimated to receive of prototype token: ${prototypeTokenAddress} amount: ${quoteAmt}`);

        // check allowance
        await this.checkTokenAllowance(amount);

        // ABI-encoded `buy` function call
        const abi = bondingAbi;
        const iface = new ethers.Interface(abi);
        let data = iface.encodeFunctionData(PurchaseType.BUY.toLowerCase(), [amount, prototypeTokenAddress]);

        // Append builderID if provided
        if (!builderID && builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(builderID), 2); // Encode builderID as 2-byte hex
            data += builderIDHex.slice(2); // Remove '0x' from builderIDHex and append
        }

        // Build the transaction
        return {
            to: this.bondingCurveAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            gasLimit: BigInt(30000), // Adjust based on estimated gas
            gasPrice: (await provider.getFeeData()).gasPrice, // Fetch the current gas price
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        };

    }

    public async buildSellPrototypeTokenRequest(prototypeTokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }
        // const bondingCurveAddr = '0xF66DeA7b3e897cD44A5a231c61B6B4423d613259';

        // estimate how many of virtuals token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.SELL, amount, prototypeTokenAddress);
        console.log('Estimated to receive amount of virtuals: ', quoteAmt);

        // check allowance
        await this.checkTokenAllowance(amount, prototypeTokenAddress);

        // ABI-encoded `sell` function call
        const abi = bondingAbi;
        const iface = new ethers.Interface(abi);
        let data = iface.encodeFunctionData(PurchaseType.SELL.toLowerCase(), [amount, prototypeTokenAddress]);

        // Append builderID if provided
        if (!builderID && builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(builderID), 2); // Encode builderID as 2-byte hex
            data += builderIDHex.slice(2); // Remove '0x' from builderIDHex and append
        }

        // Build the transaction
        return {
            to: this.bondingCurveAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            gasLimit: BigInt(30000), // Adjust based on estimated gas
            gasPrice: (await provider.getFeeData()).gasPrice, // Fetch the current gas price
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        };
    }

    private async checkTokenAllowance(amountInWei: string, prototypeTokenAddress?: string) {
        // Use the provided prototype token address or fallback to the default virtuals token address.
        const tokenAddress = prototypeTokenAddress ? prototypeTokenAddress : this.virtualsTokenAddr;
        await this.checkAllowanceAndApprove(amountInWei, tokenAddress, this.virtualRouter);
    }

    public async getQuote(side: PurchaseType, amount: string, prototypeTokenAddress: string): Promise<string> {
        const tax = 0.99;

        const frouterContract: ethers.Contract = new ethers.Contract(this.virtualRouter, frouterAbi, this.wallet);
        if (side === PurchaseType.BUY) {
            const amountAfterDeductingTax = +amount * tax;
            return await frouterContract.getAmountsOut(parseEther(amountAfterDeductingTax.toString()), prototypeTokenAddress, this.virtualsTokenAddr);
        } else {
            // for sell prototype token to get virtuals, asset token use zero address.
            return await frouterContract.getAmountsOut(parseEther(amount), prototypeTokenAddress, '0x0000000000000000000000000000000000000000');
        }
    }
}
