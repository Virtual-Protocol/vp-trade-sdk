import { Connection, clusterApiUrl } from "@solana/web3.js";

interface ProviderConfig {
    rpcUrl?: string; // Optional to allow default cluster URL
    rpcApiKey?: string; // Only required for premium providers
}

export class SolanaProviderManager {
    private static instance: SolanaProviderManager;
    private connection: Connection;

    private constructor(config: ProviderConfig) {
        // Determine the RPC URL
        let rpcUrl = config.rpcUrl || clusterApiUrl("mainnet-beta"); // Default to mainnet-beta

        // Validate the RPC URL
        if (!this.isValidUrl(rpcUrl)) {
            throw new Error("Invalid or missing RPC URL.");
        }

        // Detect provider type
        let providerType: "alchemy" | "ankr" | "custom" = "custom";
        if (rpcUrl.includes("alchemy.com")) {
            providerType = "alchemy";
        } else if (rpcUrl.includes("ankr.com")) {
            providerType = "ankr";
        }

        console.log(`Detected Solana provider: ${providerType}`);

        // Construct final URL if API key is provided
        if (config.rpcApiKey) {
            rpcUrl = `${rpcUrl}?apiKey=${config.rpcApiKey}`;
        }

        // Initialize the Solana connection
        this.connection = new Connection(rpcUrl, "confirmed");
    }

    public static getInstance(config: ProviderConfig): SolanaProviderManager {
        if (!SolanaProviderManager.instance) {
            SolanaProviderManager.instance = new SolanaProviderManager(config);
        }
        return SolanaProviderManager.instance;
    }

    public getConnection(): Connection {
        return this.connection;
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
