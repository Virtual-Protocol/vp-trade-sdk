import { BigNumberish, ethers, parseEther, TransactionReceipt } from 'ethers';
import { ERC20TokenABI } from '../assets/ERC20';
import { bondingAbi } from '../assets/bonding';
import { frouterAbi } from '../assets/frouter';

export class TransactionManager {
    private wallet: ethers.Wallet;
    private provider: ethers.JsonRpcProvider;

    constructor(wallet: ethers.Wallet, provider: ethers.JsonRpcProvider) {
        this.wallet = wallet;
        this.provider = provider;
    }

    /**
     * Create and sign a transaction.
     * @param to - The recipient address.
     * @param value - The amount of Ether to send.
     * @returns The signed transaction as a string.
     */
    public async createTransaction(to: string, value: ethers.BigNumberish): Promise<string> {
        if (!ethers.isAddress(to)) {
            throw new Error(`Invalid recipient address: ${to}`);
        }

        const connectedWallet = this.wallet.connect(this.provider);

        const tx: ethers.TransactionRequest = {
            to,
            value: ethers.parseEther(value.toString()),
            gasLimit: ethers.toBeHex(21000),
        };

        try {
            return await connectedWallet.signTransaction(tx);
        } catch (error) {
            throw new Error(`Failed to sign transaction: ${error}`);
        }
    }

    /**
     * Send a signed transaction to the blockchain.
     * @param signedTx - The signed transaction string.
     * @returns The transaction response.
     */
    public async sendTransaction(signedTx: string): Promise<ethers.TransactionResponse> {
        try {
            return await this.provider.broadcastTransaction(signedTx);
        } catch (error) {
            throw new Error(`Failed to send transaction: ${error}`);
        }
    }

    public async buySentientToken() { }

    public async sellSentientToken() { }

    // REACT_APP_TOKEN_ADDRESS = 0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b
    // REACT_APP_VIRTUAL_FROUTER = 0x8292B43aB73EfAC11FAF357419C38ACF448202C5
    // REACT_APP_VIRTUAL_FBONDING = 0xF66DeA7b3e897cD44A5a231c61B6B4423d613259
    /**
     * Buy prototype token with virtuals.
     * @param signedTx - The signed transaction string.
     * @returns The transaction response.
     */
    public async buyPrototypeToken(prototypeTokenAddres: string, amount: string): Promise<string> {
        const bondingCurveAddr = '0xF66DeA7b3e897cD44A5a231c61B6B4423d613259';

        // estimate how many of prototype token will be received.
        const quoteAmt = await this.getQuote('BUY', amount, prototypeTokenAddres);

        // check allowance
        await this.checkAllowance(quoteAmt);

        const bondingCurve = new ethers.Contract(bondingCurveAddr, bondingAbi, this.wallet);
        const buyTx: TransactionReceipt = await bondingCurve.buy(quoteAmt, prototypeTokenAddres);

        return buyTx.hash;
    }

    public async sellPrototypeToken(prototypeTokenAddress: string, amount: string): Promise<string> {
        const bondingCurveAddr = '0xF66DeA7b3e897cD44A5a231c61B6B4423d613259';

        // estimate how many of virtuals token will be received.
        const quoteAmt = await this.getQuote('SELL', amount, prototypeTokenAddress);

        // check allowance
        await this.checkAllowance(quoteAmt.toString(), prototypeTokenAddress);

        const bondingCurve = new ethers.Contract(bondingCurveAddr, bondingAbi, this.wallet);
        const sellTx: TransactionReceipt = await bondingCurve.sell(quoteAmt, prototypeTokenAddress);

        return sellTx.hash;
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
                const tx: TransactionReceipt = await tokenContract.approve(virtualRouter, amountInWei);
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

    public async getQuote(side: 'BUY' | 'SELL', amount: string, prototypeTokenAddress: string): Promise<string> {
        const virtualsTokenAddr = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';
        const virtualRouter = '0x8292B43aB73EfAC11FAF357419C38ACF448202C5';
        const tax = 0.99;

        const frouterContract: ethers.Contract = new ethers.Contract(virtualRouter, frouterAbi, this.wallet);
        if (side === 'BUY') {

            const amountAfterDeductingTax = +amount * tax;
            return await frouterContract.getAmountsOut(parseEther(amountAfterDeductingTax.toString()), prototypeTokenAddress, virtualsTokenAddr);
        } else {

            // for sell prototype token to get virtuals, asset token use zero address.
            return await frouterContract.getAmountsOut(parseEther(amount), prototypeTokenAddress, '0x0000000000000000000000000000000000000000');
        }
    }

    //     assetRate = 0.5
    //       const K = 3000000000000;
    //       const reserveA = +1000000000;
    //       const k = K / (assetRate / 10000);
    //       const reserveB = k / 1000000000;
    //       const amountIn = +amount * 0.99; // 1% tax
    //       const newReserveB = reserveB + amountIn;
    //       const newReserveA = k / newReserveB;
    //       const amountOut = reserveA - newReserveA;
    //       return amountOut;
    // percentage =
    //     return (amountToReceive / +1000000000) * 100;
}
