import { ethers } from 'ethers';

interface WalletConfig {
    privateKey: string;
    provider: ethers.JsonRpcProvider;
}

export class WalletManager {

    private static instance: WalletManager;
    private wallet: ethers.Wallet;

    /**
     * Initializes the wallet with the private key from environment variables.
     * Accessible only within the package.
     */

    private constructor(config: WalletConfig) {
        if (!config.privateKey) {
            throw new Error('Private key is not configured');
        }
        if (!config.provider) {
            throw new Error('Provider is not configured');
        }
        this.wallet = new ethers.Wallet(config.privateKey, config.provider);
    }


    /**
     * Retrieves the wallet instance. If not initialized, initializes it.
     * Accessible only within the package.
     */
    public static getInstance(config: WalletConfig): WalletManager {
        if (!WalletManager.instance) {
            WalletManager.instance = new WalletManager(config);
        }
        return WalletManager.instance;
    }

    public getWallet(): ethers.Wallet {
        return this.wallet;
    }
}
