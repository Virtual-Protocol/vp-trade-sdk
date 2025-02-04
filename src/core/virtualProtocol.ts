import dotenv from "dotenv";
import needle from "needle";
import { FILTER_AGENT_STATUS, TokenType } from "./../constant";

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
}

interface VirtualApiConfig {
  apiUrl: string;
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

export interface GetKlinesParams {
  tokenAddress: string; // Token address to get klines for
  granularity: number; // Time granularity in seconds
  start: number; // Start time in milliseconds (UTC)
  end: number; // End time in milliseconds (UTC)
  limit: number; // Maximum number of klines to return
}

class VirtualApiManager {
  private apiUrl: string;

  constructor(config: VirtualApiConfig) {
    if (!config.apiUrl) {
      throw new Error("Virtuals API URL cannot be empty");
    }

    this.apiUrl = config.apiUrl;
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
      const response = await needle("get", `${this.apiUrl}?${queryString}`, {
        headers: { accept: "application/json" },
      });

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
    page: number,
    pageSize: number
  ): Promise<TokenList> {
    try {
      const queryParams = {
        "filters[status]": "",
        "sort[0]": "totalValueLocked:desc",
        "sort[1]": "createdAt:desc",
        "populate[0]": "image",
        "pagination[page]": page.toString(),
        "pagination[pageSize]": pageSize.toString(),
      };

      // Set the status condition based on tokenAddress
      if (type === TokenType.SENTIENT) {
        queryParams["filters[status]"] =
          FILTER_AGENT_STATUS.SENTIENT.toString();
      } else {
        queryParams["filters[status]"] =
          FILTER_AGENT_STATUS.PROTOTYPE.toString();
      }

      // Use URLSearchParams to build the query string
      const queryString = new URLSearchParams(queryParams).toString();

      // Make the GET request to Virtuals API
      const response = await needle("get", `${this.apiUrl}?${queryString}`, {
        headers: { accept: "application/json" },
      });

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
      };

      const queryString = new URLSearchParams(queryParams).toString();

      const response = await needle(
        "get",
        `https://vp-api.virtuals.io/vp-api/klines?${queryString}`,
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
}

export default VirtualApiManager;
