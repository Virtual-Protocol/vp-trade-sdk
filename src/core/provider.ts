import { ethers } from 'ethers';

interface ProviderConfig {
    rpcUrl: string;
    apiKey: string;
}

export class ProviderManager {

    private static instance: ProviderManager;
    private provider: ethers.JsonRpcProvider;

    private constructor(config: ProviderConfig) {
        // Validate the RPC URL and API key
        if (!config.rpcUrl || !this.isValidUrl(config.rpcUrl)) {
            throw new Error('Invalid or missing RPC URL.');
        }

        if (!config.apiKey) {
            throw new Error('Missing API key.');
        }

        // Initialize the provider
        // this.provider = new ethers.JsonRpcProvider(`${config.rpcUrl}?apiKey=${config.apiKey}`);
        this.provider = new ethers.AlchemyProvider('base', config.apiKey);
    }

    public static getInstance(config: ProviderConfig): ProviderManager {
        if (!ProviderManager.instance) {
            ProviderManager.instance = new ProviderManager(config);
        }
        return ProviderManager.instance;
    }

    public getProvider(): ethers.JsonRpcProvider {
        return this.provider;
    }

    /**
     * Validate a URL format.
     * @param url - The URL to validate
     */
    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
