import { Keypair, Connection } from "@solana/web3.js";

interface WalletConfig {
    privateKey: string; // Private key as a hex string
    connection: Connection; // Solana connection instance
}

export class SolanaWalletManager {
    private static instance: SolanaWalletManager;
    private wallet: Keypair;

    /**
     * Initializes the wallet with the private key from environment variables.
     */
    private constructor(config: WalletConfig) {
        if (!config.privateKey) {
            throw new Error("Private key is not configured");
        }
        if (!config.connection) {
            throw new Error("Connection is not configured");
        }

        this.wallet = this.getKeypairFromHex(config.privateKey);
        console.log("Solana Wallet Public Key:", this.wallet.publicKey.toBase58());
    }

    /**
     * Retrieves the wallet instance. If not initialized, initializes it.
     */
    public static getInstance(config: WalletConfig): SolanaWalletManager {
        if (!SolanaWalletManager.instance) {
            SolanaWalletManager.instance = new SolanaWalletManager(config);
        }
        return SolanaWalletManager.instance;
    }

    public getWallet(): Keypair {
        return this.wallet;
    }

    /**
     * Converts a hex-encoded private key into a Solana Keypair.
     * @param hexString - Private key in hex format.
     */
    private getKeypairFromHex(hexString: string): Keypair {
        const privateKeyBytes = new Uint8Array(Buffer.from(hexString, "hex"));
        return Keypair.fromSecretKey(privateKeyBytes);
    }
}
