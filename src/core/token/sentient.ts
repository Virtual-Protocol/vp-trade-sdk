import { ethers } from 'ethers';
import { uniswapV2routerAbi } from '../../assets/uniswapV2router';
import { TokenBase } from './tokenbase'
import { PurchaseType } from '../../constant/common';

export class Sentient extends TokenBase {
    private uniswapV2routerAddr: string;

    constructor(wallet: ethers.Wallet, uniswapV2routerAddr: string) {
        super(wallet);
        this.uniswapV2routerAddr = uniswapV2routerAddr;
    }

    public async swapSentientToken(purchaseType: PurchaseType, fromTokenAddress: string, toTokenAddress: string, amount: string, builderID?: number, slippage?: number): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }

        const uniswapV2routerContract = new ethers.Contract(this.uniswapV2routerAddr, uniswapV2routerAbi, this.wallet);

        // Get the quote
        const amountInInWei = ethers.parseEther(amount); // Input amount
        const path = [fromTokenAddress, toTokenAddress]; // Token A -> Token B
        const amountsOutInWei = await uniswapV2routerContract.getAmountsOut(amountInInWei, path);

        // Default slippage percentage to 5%
        const userSlippagePercentage = slippage ? slippage : 5; // Use provided slippage or default to 5%

        // Calculate amountOutMinInWei with the user-defined slippage
        const slippageFraction = (ethers.toBigInt(userSlippagePercentage) * ethers.toBigInt(10000)) / ethers.toBigInt(10000); // Convert percentage to fraction
        const amountOutMinInWei = ethers.toBigInt(amountsOutInWei[1]) - (ethers.toBigInt(amountsOutInWei[1]) * slippageFraction) / ethers.toBigInt(100);

        console.log('amountOutInWei: ', amountsOutInWei.toString());
        console.log('amountOutMinInWei: ', amountOutMinInWei.toString());

        // Notes: removed, this should be responsibility on builder.
        // await this.checkTokenAllowance(amountInInWei.toString(), fromTokenAddress);

        // Execute the swap
        const to = this.wallet.address;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

        // ABI-encoded `swap` function call
        const iface = new ethers.Interface(uniswapV2routerAbi);

        let data;
        if (purchaseType === PurchaseType.BUY) {
            data = iface.encodeFunctionData('swapExactTokensForTokens', [amountInInWei, amountOutMinInWei, path, to, deadline]);
        } else {

            // upon selling sentient tokens there is fees imposed.
            data = iface.encodeFunctionData('swapExactTokensForTokensSupportingFeeOnTransferTokens', [amountInInWei, amountOutMinInWei, path, to, deadline]);
        }

        // Append builderID if provided
        if (!builderID && builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(builderID), 2); // Encode builderID as 2-byte hex
            data += builderIDHex.slice(2); // Remove '0x' from builderIDHex and append
        }

        // Build the transaction
        let tx: ethers.TransactionRequest = {
            from: this.wallet.address,
            to: this.uniswapV2routerAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        }
        tx = await this.estimateGas(tx);

        return tx;
    }

    private async checkTokenAllowance(amountInWei: string, fromTokenAddress: string) {
        await this.checkAllowanceAndApprove(amountInWei, fromTokenAddress, this.uniswapV2routerAddr);
    }
}