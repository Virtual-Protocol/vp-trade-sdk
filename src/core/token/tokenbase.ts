import { BigNumberish, ContractTransactionReceipt, ethers } from 'ethers';
import { ERC20TokenABI } from '../../assets/ERC20';

export class TokenBase {
    protected wallet: ethers.Wallet;

    constructor(wallet: ethers.Wallet) {
        this.wallet = wallet;
    }

    protected async checkAllowance(amount: string, tokenAddress: string, routerAddress: string): Promise<boolean> {
        const tokenContract: ethers.Contract = new ethers.Contract(tokenAddress, ERC20TokenABI, this.wallet);
        const amountInWei = ethers.parseEther(amount);

        // Check wallet balance first.
        const tokenBalance: BigNumberish = await tokenContract.balanceOf(this.wallet.address);
        console.log('tokenBalance:', tokenBalance)
        if (!tokenBalance || BigInt(tokenBalance) < BigInt(amountInWei)) {
            throw new Error(`Connected wallet doesn't have enough balance: ${tokenBalance}`);
        }

        // Get allowance.
        const allowance: BigNumberish = await tokenContract.allowance(this.wallet.address, routerAddress);

        if (!allowance || BigInt(allowance) < BigInt(amountInWei)) {
            return false;
        }
        return true;
    }

    protected async approveAllowance(amount: string, tokenAddress: string, routerAddress: string): Promise<string> {
        const tokenContract: ethers.Contract = new ethers.Contract(tokenAddress, ERC20TokenABI, this.wallet);
        const amountInWei = ethers.parseEther(amount);

        try {
            // Approve allowance to the router address
            const tx: ContractTransactionReceipt = await tokenContract.approve(routerAddress, amountInWei);

            console.log(`Allowance has been approved: ${tx.hash}, amount: ${amountInWei}`);
            return tx.hash
        } catch (error) {
            throw new Error(`Failed to approve allowance: ${error}`);
        }
    }

    // protected async checkAllowanceAndApprove(amountInWei: string, tokenAddress: string, routerAddress: string) {
    //     const tokenContract: ethers.Contract = new ethers.Contract(tokenAddress, ERC20TokenABI, this.wallet);

    //     console.log('amountInWei', amountInWei);

    //     // Check wallet balance first.
    //     const tokenBalance: BigNumberish = await tokenContract.balanceOf(this.wallet.address);
    //     console.log('tokenBalance:', tokenBalance)
    //     if (!tokenBalance || BigInt(tokenBalance) < BigInt(amountInWei)) {
    //         throw new Error(`Connected wallet doesn't have enough balance: ${tokenBalance}`);
    //     }

    //     // Get allowance.
    //     const allowance: BigNumberish = await tokenContract.allowance(this.wallet.address, routerAddress);

    //     // Send an approve allowance tx if allowance is less than amount.
    //     if (!allowance || BigInt(allowance) < BigInt(amountInWei)) {
    //         try {
    //             // Approve allowance to the router address
    //             const tx: ContractTransactionReceipt = await tokenContract.approve(routerAddress, amountInWei);

    //             console.log(`Allowance has been approved: ${tx.hash}, amount: ${amountInWei}`);
    //             return;
    //         } catch (error) {
    //             throw new Error(`Failed to approve allowance: ${error}`);
    //         }
    //     }

    //     console.log(`Connected wallet has enough allowance amount: ${allowance}`);
    //     return;
    // }

    protected async estimateGas(tx: ethers.TransactionRequest): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        console.log('sooka')
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }
        console.log('1')
        console.log(tx)
        let gas = await provider.estimateGas(tx)
        console.log('2')
        // Info: Estimate gas top up 15%.
        gas = (gas * ethers.toBigInt(115)) / ethers.toBigInt(100);
        console.log('gas', gas)

        const fee = await provider.getFeeData();
        if (fee.maxFeePerGas && fee.maxPriorityFeePerGas) {
            console.log('fee.maxFeePerGas', fee.maxFeePerGas)
            console.log('fee.maxPriorityFeePerGas)', fee.maxPriorityFeePerGas)
            // EIP-1559 Transaction
            const adjustedMaxFeePerGas = (fee.maxFeePerGas * ethers.toBigInt(115)) / ethers.toBigInt(100); // 15% buffer
            const adjustedMaxPriorityFeePerGas = (fee.maxPriorityFeePerGas * ethers.toBigInt(115)) / ethers.toBigInt(100); // 15% buffer

            tx.gasLimit = gas;
            tx.maxFeePerGas = adjustedMaxFeePerGas;
            tx.maxPriorityFeePerGas = adjustedMaxPriorityFeePerGas;
            return tx;

        } else if (fee.gasPrice) {
            console.log('fee.gasPrice', fee.gasPrice)
            // Non-EIP-1559 (legacy transaction)
            const adjustedGasPrice = (fee.gasPrice * ethers.toBigInt(115)) / ethers.toBigInt(100); // 15% buffer
            tx.gasLimit = gas;
            tx.gasPrice = adjustedGasPrice;
            return tx;

        }

        throw new Error('Failed to estimate gas: no fee data available');
    }
}