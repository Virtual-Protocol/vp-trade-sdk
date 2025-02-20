import dotenv from "dotenv";
import needle from "needle";
import {
  AGENT_CHAIN_ID,
  AGENT_CHAIN_MAP,
  FILTER_AGENT_STATUS,
  KLINE_CHAIN_ID,
  TokenType,
} from "./../constant";

dotenv.config();

interface TokenList {
  tokens: Token[];
}

interface Token {
  id: number; // Represents the unique identifier of the token
  name: string; // Name of the token
  status: string; // Status of the token (e.g., "AVAILABLE")
  tokenAddress: string; // The address of the token
  preToken: string; // The address of the pre-bonding token
  description: string; // A brief description of the token
  lpAddress: string; // The address of the post-bonding token pair
  preTokenPair: string; // The address of the pre-bonding token pair
  symbol: string; // Symbol of the token (e.g., "LUNA")
  holderCount: number; // Number of holders of the token
  mcapInVirtual: number; // Market cap in virtual (e.g., in USD or other virtual currency)
  socials: {
    VERIFIED_LINKS: {
      TWITTER: string; // Verified Twitter link
      TELEGRAM: string; // Verified Telegram link
    };
  };
  image: {
    id: number; // ID of the image resource
    url: string; // URL of the image (e.g., the token's logo)
  };
  chain: string; // Chain of the token
}

interface VirtualApiConfig {
  apiUrl: string;
  apiUrlV2: string;
}

export interface KLine {
  granularity: number; // K-line time granularity
  tokenAddress: string; // Token address
  open: string; // Price of the first trade
  high: string; // Highest trade price
  low: string; // Lowest trade price
  close: string; // Price of the last trade
  volume: string; // Total trading volume in $Virtual
  startInMilli: number; // Start time in millisecond
  endInMilli: number; // End time in millisecond
}

export interface Trade {
  txSender: string; // Transaction sender
  txHash: string; // Transaction hash
  tokenAddress: string; // Token address
  isBuy: boolean; // Whether the trade is a buy
  agentTokenAmt: string; // Amount of prototype token
  virtualTokenAmt: string; // Amount of virtual token worth
  price: string; // Price of the trade in virtual
  timestamp: number; // Timestamp in seconds
}

export interface GetKlinesParams {
  tokenAddress: string; // Token address to get klines for
  granularity: number; // Time granularity in seconds
  start: number; // Start time in milliseconds (UTC)
  end: number; // End time in milliseconds (UTC)
  limit: number; // Maximum number of klines to return
  chainId?: KLINE_CHAIN_ID; // Chain ID
}

export interface GetLatestTradesParams {
  tokenAddress: string; // Token address to get klines for
  limit: number; // Maximum number of klines to return
  chainId?: KLINE_CHAIN_ID; // Chain ID
  txSender?: string; // Transaction sender
}

class VirtualApiManager {
  private apiUrl: string;
  private apiUrlV2: string;
  constructor(config: VirtualApiConfig) {
    if (!config.apiUrl) {
      throw new Error("Virtuals API URL cannot be empty");
    }

    this.apiUrl = config.apiUrl || "https://api.virtuals.io";
    this.apiUrlV2 = config.apiUrlV2 || "https://vp-api.virtuals.io";
  }

  /**
   * Search for a token by keyword
   * @param keyword The keyword to search for, can be token address, name or symbol
   * @returns The token data
   */
  public async searchVirtualTokensByKeyword(keyword: string): Promise<Token> {
    try {
      // Define the query parameters
      const queryParams = {
        "filters[status]": FILTER_AGENT_STATUS.SEARCH.toString(),
        "filters[$or][0][name][$contains]": keyword,
        "filters[$or][1][symbol][$contains]": keyword,
        "filters[$or][2][tokenAddress][$contains]": keyword,
        "filters[$or][3][preToken][$contains]": keyword,
        "sort[0]": "totalValueLocked:desc",
        "sort[1]": "createdAt:desc",
        "populate[0]": "image",
        "pagination[page]": "1",
        "pagination[pageSize]": "10",
      };

      // Use URLSearchParams to build the query string
      const queryString = new URLSearchParams(queryParams).toString();

      // Make the GET request to Virtuals API
      const response = await needle(
        "get",
        `${this.apiUrl}/api/virtuals?${queryString}`,
        {
          headers: { accept: "application/json" },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error(
          `Failed to fetch token lists. Status code: ${response.statusCode}`
        );
      }

      // Map the response data to match the TokenList structure
      return response.body.data.map((item: Token) => ({
        id: item.id ?? 0,
        name: item.name ?? "",
        status: item.status ?? "",
        tokenAddress: item.tokenAddress || item.preToken || "",
        description: item.description ?? "",
        lpAddress: item.lpAddress || item.preTokenPair || "",
        symbol: item.symbol ?? "",
        holderCount: item.holderCount ?? 0,
        mcapInVirtual: item.mcapInVirtual ?? 0,
        socials: {
          VERIFIED_LINKS: {
            TWITTER: item.socials?.VERIFIED_LINKS?.TWITTER ?? "",
            TELEGRAM: item.socials?.VERIFIED_LINKS?.TELEGRAM ?? "",
          },
        },
        image: {
          id: item.image?.id ?? 0,
          url: item.image?.url ?? "",
        },
        chain: item.chain ?? "",
      }))[0];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching token lists.";
      throw new Error(`Error fetching token lists: ${errorMessage}`);
    }
  }

  /**
   * Fetch the token lists from the Virtuals API.
   * @param type The type of the virtual listing ('prototype' or 'sentient').
   * @param page The page number for pagination.
   * @param pageSize The page size for pagination.
   * @returns The token list data.
   */
  public async fetchVirtualTokenLists(
    type: string,
    agentChainId: AGENT_CHAIN_ID,
    page: number,
    pageSize: number
  ): Promise<TokenList> {
    try {
      const queryParams: { [key: string]: string } = {
        "filters[status]": "",
        "sort[0]": "",
        "sort[1]": "createdAt:desc",
        "populate[0]": "image",
        "pagination[page]": page.toString(),
        "pagination[pageSize]": pageSize.toString(),
      };

      // Set the status condition based on tokenAddress
      if (type === TokenType.SENTIENT) {
        queryParams["filters[status]"] =
          FILTER_AGENT_STATUS.SENTIENT.toString();
        queryParams["sort[0]"] = "totalValueLocked:desc";
      } else if (type === TokenType.PROTOTYPE) {
        queryParams["filters[status]"] =
          FILTER_AGENT_STATUS.PROTOTYPE.toString();
        queryParams["sort[0]"] = "virtualTokenValue:desc";
      }

      if (agentChainId !== AGENT_CHAIN_ID.ALL) {
        queryParams["filters[chain]"] = AGENT_CHAIN_MAP[agentChainId];
      }

      // Use URLSearchParams to build the query string
      const queryString = new URLSearchParams(queryParams).toString();

      // Make the GET request to Virtuals API
      const response = await needle(
        "get",
        `${this.apiUrl}/api/virtuals?${queryString}`,
        {
          headers: { accept: "application/json" },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error(
          `Failed to fetch token lists. Status code: ${response.statusCode}`
        );
      }

      // Map the response data to match the TokenList structure
      return {
        tokens: response.body.data.map((item: Token) => ({
          id: item.id ?? 0,
          name: item.name ?? "",
          status: item.status ?? "",
          tokenAddress: item.tokenAddress || item.preToken || "",
          description: item.description ?? "",
          lpAddress: item.lpAddress || item.preTokenPair || "",
          symbol: item.symbol ?? "",
          holderCount: item.holderCount ?? 0,
          mcapInVirtual: item.mcapInVirtual ?? 0,
          socials: {
            VERIFIED_LINKS: {
              TWITTER: item.socials?.VERIFIED_LINKS?.TWITTER ?? "",
              TELEGRAM: item.socials?.VERIFIED_LINKS?.TELEGRAM ?? "",
            },
          },
          image: {
            id: item.image?.id ?? 0,
            url: item.image?.url ?? "",
          },
          chain: item.chain ?? "",
        })),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching token lists.";
      throw new Error(`Error fetching token lists: ${errorMessage}`);
    }
  }

  /**
   * Fetch K-line (candlestick) data for a specific token
   * @param params Parameters for the K-line data request
   * @returns Array of KLine data
   */
  public async fetchKlines(params: GetKlinesParams): Promise<KLine[]> {
    try {
      const queryParams = {
        tokenAddress: params.tokenAddress,
        granularity: params.granularity.toString(),
        start: params.start.toString(),
        end: params.end.toString(),
        limit: params.limit.toString(),
        chainID: (params.chainId ?? KLINE_CHAIN_ID.BASE).toString(),
      };

      const queryString = new URLSearchParams(queryParams).toString();

      const response = await needle(
        "get",
        `${this.apiUrlV2}/vp-api/klines?${queryString}`,
        {
          headers: { accept: "application/json" },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error(
          `Failed to fetch klines. Status code: ${response.statusCode}`
        );
      }

      // Access the correct path in response data
      return response.body.data.Klines.map((item: KLine) => ({
        granularity: item.granularity,
        tokenAddress: item.tokenAddress,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        startInMilli: item.startInMilli,
        endInMilli: item.endInMilli,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching klines.";
      throw new Error(`Error fetching klines: ${errorMessage}`);
    }
  }

  /**
   * Fetch latest trades for a specific token
   * @param params Parameters for the latest trades data request
   * @returns Array of Trade data
   */
  public async fetchLatestTrades(
    params: GetLatestTradesParams
  ): Promise<Trade[]> {
    try {
      const queryParams = {
        tokenAddress: params.tokenAddress,
        limit: params.limit.toString(),
        chainID: (params.chainId ?? KLINE_CHAIN_ID.BASE).toString(),
        txSender: params.txSender ?? "",
      };

      const queryString = new URLSearchParams(queryParams).toString();

      const response = await needle(
        "get",
        `${this.apiUrlV2}/vp-api/trades?${queryString}`,
        {
          headers: { accept: "application/json" },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error(
          `Failed to fetch trades. Status code: ${response.statusCode}`
        );
      }

      // Access the correct path in response data
      return response.body.data.Trades.map((item: Trade) => ({
        txSender: item.txSender,
        txHash: item.txHash,
        tokenAddress: item.tokenAddress,
        isBuy: item.isBuy,
        agentTokenAmt: item.agentTokenAmt,
        virtualTokenAmt: item.virtualTokenAmt,
        price: item.price,
        timestamp: item.timestamp,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching trades.";
      throw new Error(`Error fetching trades: ${errorMessage}`);
    }
  }
}

export default VirtualApiManager;
