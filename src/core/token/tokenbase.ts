import { BigNumberish, ContractTransactionReceipt, ethers } from 'ethers';
import { ERC20TokenABI } from '../../assets/ERC20';

export class TokenBase {
    protected wallet: ethers.Wallet;

    constructor(wallet: ethers.Wallet) {
        this.wallet = wallet;
    }

    protected async checkAllowanceAndApprove(amountInWei: string, tokenAddress: string, routerAddress: string) {
        const tokenContract: ethers.Contract = new ethers.Contract(tokenAddress, ERC20TokenABI, this.wallet);

        // Check wallet balance first.
        const tokenBalance: BigNumberish = await tokenContract.balanceOf(this.wallet.address);
        if (!tokenBalance || BigInt(tokenBalance) < BigInt(amountInWei)) {
            throw new Error(`Connected wallet doesn't have enough balance: ${tokenBalance}`);
        }

        // Get allowance.
        const allowance: BigNumberish = await tokenContract.allowance(this.wallet.address, routerAddress);

        // Send an approve allowance tx if allowance is less than amount.
        if (!allowance || BigInt(allowance) < BigInt(amountInWei)) {
            try {
                // Approve allowance to the router address
                const tx: ContractTransactionReceipt = await tokenContract.approve(routerAddress, amountInWei);

                console.log(`Allowance has been approved: ${tx.hash}, amount: ${amountInWei}`);
                return;
            } catch (error) {
                throw new Error(`Failed to approve allowance: ${error}`);
            }
        }

        console.log(`Connected wallet has enough allowance amount: ${allowance}`);
        return;
    }
}