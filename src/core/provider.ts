import { ethers } from "ethers";

interface ProviderConfig {
  rpcUrl: string;
  rpcApiKey: string;
}

export class ProviderManager {
  private static instance: ProviderManager;
  private provider: ethers.JsonRpcProvider;

  private constructor(config: ProviderConfig) {
    // Validate the RPC URL and API key
    if (!config.rpcUrl || !this.isValidUrl(config.rpcUrl)) {
      throw new Error("Invalid or missing RPC URL.");
    }

    if (!config.rpcApiKey) {
      throw new Error("Missing Rpc API key.");
    }

    // Initialize the provider
    // Determine the provider type based on the RPC URL
    let providerType: "alchemy" | "ankr" | "custom" = "custom";
    if (config.rpcUrl.includes("alchemy.com")) {
      providerType = "alchemy";
    } else if (config.rpcUrl.includes("ankr.com")) {
      providerType = "ankr";
    }

    console.log(`Detected provider: ${providerType}`);

    // Initialize the provider based on the detected type
    switch (providerType) {
      case "alchemy":
        this.provider = new ethers.AlchemyProvider("base", config.rpcApiKey);
        break;
      case "ankr":
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        break;
      default:
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        break;
    }
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
