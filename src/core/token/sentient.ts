import { ethers } from 'ethers';
import { uniswapV2routerAbi } from '../../assets/uniswapV2router';
import { TokenBase } from './tokenbase'

export class Sentient extends TokenBase {
    private uniswapV2routerAddr: string;

    constructor(wallet: ethers.Wallet, uniswapV2routerAddr: string) {
        super(wallet);
        this.uniswapV2routerAddr = uniswapV2routerAddr;
    }

    public async swapSentientToken(fromTokenAddress: string, toTokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }
        // const uniswapV2routerAddr = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';
        const uniswapV2routerContract = new ethers.Contract(this.uniswapV2routerAddr, uniswapV2routerAbi, this.wallet);

        // Get the quote
        const amountInInWei = ethers.parseEther(amount); // Input amount
        const path = [fromTokenAddress, toTokenAddress]; // Token A -> Token B
        const amountsOutInWei = await uniswapV2routerContract.getAmountsOut(amountInInWei, path);

        // to have user to input slippage?
        const amountOutMinInWei = amountsOutInWei[1].sub(amountsOutInWei[1].mul(5).div(100)); // 5% slippage

        console.log(`Minimum amount out: ${ethers.formatEther(amountOutMinInWei)}`);

        await this.checkTokenAllowance(amountInInWei.toString(), fromTokenAddress);

        // Execute the swap
        const to = this.wallet.address;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

        // ABI-encoded `swap` function call
        const iface = new ethers.Interface(uniswapV2routerAbi);
        let data = iface.encodeFunctionData('swapExactTokensForTokens', [amountInInWei, amountOutMinInWei, path, to, deadline]);

        // Append builderID if provided
        if (!builderID && builderID !== undefined) {
            const builderIDHex = ethers.zeroPadValue(ethers.toBeHex(builderID), 2); // Encode builderID as 2-byte hex
            data += builderIDHex.slice(2); // Remove '0x' from builderIDHex and append
        }

        // Build the transaction
        return {
            to: this.uniswapV2routerAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            gasLimit: BigInt(30000), // Adjust based on estimated gas
            gasPrice: (await provider.getFeeData()).gasPrice, // Fetch the current gas price
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        };
    }

    private async checkTokenAllowance(amountInWei: string, fromTokenAddress: string) {
        await this.checkAllowanceAndApprove(amountInWei, fromTokenAddress, this.uniswapV2routerAddr);
    }
}
