import { BigNumberish, ContractTransactionReceipt, ethers, parseEther } from 'ethers';
import { ERC20TokenABI } from '../../assets/ERC20';
import { bondingAbi } from '../../assets/bonding';
import { frouterAbi } from '../../assets/frouter';
import { PurchaseType } from '../../constant';

export class TransactionManager {
    private wallet: ethers.Wallet;

    constructor(wallet: ethers.Wallet) {
        this.wallet = wallet;
    }

    public async action(purchaseType: PurchaseType, prototypeTokenAddress: string, amount: string, builderID?: number) {
        // Validate if the purchase type is BUY/SELL
        if (purchaseType === PurchaseType.BUY) {
            return this.buyPrototypeToken(prototypeTokenAddress, amount, builderID);
        } else {
            return this.sellPrototypeToken(prototypeTokenAddress, amount, builderID);
        }
    }

    /**
     * Buy prototype token with virtuals.
     * @param signedTx - The signed transaction string.
     * @returns The transaction response.
     */
    private async buyPrototypeToken(prototypeTokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }
        const bondingCurveAddr = '0xF66DeA7b3e897cD44A5a231c61B6B4423d613259';

        // estimate how many of prototype token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.BUY, amount, prototypeTokenAddress);
        console.log(`Estimated to receive of prototype token: ${prototypeTokenAddress} amount: ${quoteAmt}`);

        // check allowance
        await this.checkAllowance(amount);

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
            to: bondingCurveAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            gasLimit: BigInt(30000), // Adjust based on estimated gas
            gasPrice: (await provider.getFeeData()).gasPrice, // Fetch the current gas price
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        };

    }

    private async sellPrototypeToken(prototypeTokenAddress: string, amount: string, builderID?: number): Promise<ethers.TransactionRequest> {
        const provider = this.wallet.provider;
        if (!provider) {
            throw new Error('No provider found for the connected wallet');
        }
        const bondingCurveAddr = '0xF66DeA7b3e897cD44A5a231c61B6B4423d613259';

        // estimate how many of virtuals token will be received.
        const quoteAmt = await this.getQuote(PurchaseType.SELL, amount, prototypeTokenAddress);
        console.log('Estimated to receive amount of virtuals: ', quoteAmt);

        // check allowance
        await this.checkAllowance(amount, prototypeTokenAddress);

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
            to: bondingCurveAddr,
            data, // Encoded function call with builderID appended
            value: ethers.parseEther('0'), // Ether value to send with the transaction if required
            gasLimit: BigInt(30000), // Adjust based on estimated gas
            gasPrice: (await provider.getFeeData()).gasPrice, // Fetch the current gas price
            nonce: await this.wallet.getNonce(), // Current transaction count for the wallet
            chainId: await provider.getNetwork().then((network) => network.chainId), // Current chain ID
        };
    }


    /**
     * Check allowance of virtual token with connected wallet address.
     * @param amountInWei - The amount needed to purchase prototype token.
     * @returns Return when allowance set succesful or return if has enough allowance.
     */
    private async checkAllowance(amountInWei: string, prototypeTokenAddress?: string) {
        const virtualsTokenAddr = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';
        const virtualRouter = '0x8292B43aB73EfAC11FAF357419C38ACF448202C5';

        // if its preTokenAddress then use it otherwise use virtualsTokenAddr.
        // if preTokenAddress meaning its selling prototype token.
        // if preTokenAddress is not provided then its buying prototype token.
        const tokenContract: ethers.Contract = new ethers.Contract(prototypeTokenAddress ? prototypeTokenAddress : virtualsTokenAddr, ERC20TokenABI, this.wallet);

        // check wallet balance first.
        const tokenBalance: BigNumberish = await tokenContract.balanceOf(this.wallet.address)
        if (!tokenBalance || BigInt(tokenBalance) < BigInt(amountInWei)) {
            throw new Error(`Connected wallet doesn't have enough balance: ${tokenBalance}`);
        }

        // get allowance.
        const allowance: BigNumberish = await tokenContract.allowance(this.wallet.address, virtualRouter);

        // send an approve allowance tx if allowance is less than amount.
        if (!allowance || BigInt(allowance) < BigInt(amountInWei)) {
            try {
                // for prototype token buy sell it is always approve allowance to virtual router.
                const tx: ContractTransactionReceipt = await tokenContract.approve(virtualRouter, amountInWei);

                console.log(`Allowance has been approved: ${tx.hash}, amount: ${amountInWei}`);
                return;
            }
            catch (error) {
                throw new Error(`Failed to approve allowance: ${error}`);
            }
        }
        console.log(`Connected wallet has enough allowance amount: ${allowance}`);
        return;
    }

    public async getQuote(side: PurchaseType, amount: string, prototypeTokenAddress: string): Promise<string> {
        const virtualsTokenAddr = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';
        const virtualRouter = '0x8292B43aB73EfAC11FAF357419C38ACF448202C5';
        const tax = 0.99;

        const frouterContract: ethers.Contract = new ethers.Contract(virtualRouter, frouterAbi, this.wallet);
        if (side === PurchaseType.BUY) {
            const amountAfterDeductingTax = +amount * tax;
            return await frouterContract.getAmountsOut(parseEther(amountAfterDeductingTax.toString()), prototypeTokenAddress, virtualsTokenAddr);
        } else {
            // for sell prototype token to get virtuals, asset token use zero address.
            return await frouterContract.getAmountsOut(parseEther(amount), prototypeTokenAddress, '0x0000000000000000000000000000000000000000');
        }
    }
}
