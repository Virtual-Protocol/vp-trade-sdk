import dotenv from 'dotenv';
import needle from 'needle';
import { TokenType } from './../constant';

dotenv.config();

interface TokenList {
    tokens: Token[];
}

interface Token {
    id: number; // Represents the unique identifier of the token
    name: string; // Name of the token
    status: string; // Status of the token (e.g., "AVAILABLE")
    tokenAddress: string; // The address of the token
    description: string; // A brief description of the token
    lpAddress: string; // Liquidity pool address for the token
    symbol: string; // Symbol of the token (e.g., "LUNA")
    holderCount: number; // Number of holders of the token
    mcapInVirtual: number; // Market cap in virtual (e.g., in USD or other virtual currency)
    socials: {
        x: string; // Link to the token's social media (e.g., Twitter handle)
        TWITTER: string; // Verified Twitter link
        VERIFIED_LINKS: {
            TWITTER: string; // Verified Twitter link
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

class VirtualApiManager {
    private apiUrl: string;

    constructor(config: VirtualApiConfig) {

        if (!config.apiUrl) {
            throw new Error('Virtuals API URL cannot be empty');
        };

        this.apiUrl = config.apiUrl;
    }

    public async fetchVirtualTokensByAddress(tokenAddress: string): Promise<Token> {
        try {
            // Define the query parameters
            const queryParams = {
                'filters[status][$in][0]': 'AVAILABLE',
                'filters[status][$in][1]': 'ACTIVATING',
                'filters[status][$in][2]': 'UNDERGRAD',
                'filters[priority][$ne]': '-1',
                'filters[$or][0][name][$contains]': tokenAddress,
                'filters[$or][1][symbol][$contains]': tokenAddress,
                'filters[$or][2][tokenAddress][$contains]': tokenAddress,
                'filters[$or][3][preToken][$contains]': tokenAddress,
                'sort[0]': 'totalValueLocked:desc',
                'sort[1]': 'createdAt:desc',
                'populate[0]': 'image',
                'pagination[page]': '1',
                'pagination[pageSize]': '10',
            };

            // Use URLSearchParams to build the query string
            const queryString = new URLSearchParams(queryParams).toString();

            // Make the GET request to Virtuals API
            const response = await needle('get', `${this.apiUrl}?${queryString}`, {
                headers: { accept: 'application/json' }
            });

            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch token lists. Status code: ${response.statusCode}`);
            }

            // Map the response data to match the TokenList structure
            return response.body.data.map((item: Token) => ({
                id: item.id ?? 0,
                name: item.name ?? '',
                status: item.status ?? '',
                tokenAddress: item.tokenAddress ?? '',
                description: item.description ?? '',
                lpAddress: item.lpAddress ?? '',
                symbol: item.symbol ?? '',
                holderCount: item.holderCount ?? 0,
                mcapInVirtual: item.mcapInVirtual ?? 0,
                socials: {
                    x: item.socials?.x ?? '',
                    TWITTER: item.socials?.TWITTER ?? '',
                    VERIFIED_LINKS: {
                        TWITTER: item.socials?.VERIFIED_LINKS?.TWITTER ?? '',
                    },
                },
                image: {
                    id: item.image?.id ?? 0,
                    url: item.image?.url ?? '',
                }
            }))[0];

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching token lists.';
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

    public async fetchVirtualTokenLists(type: string, page: number, pageSize: number): Promise<TokenList> {
        try {

            const queryParams = {
                'filters[status][$in][0]': '',
                'filters[status][$in][1]': '',
                'filters[priority][$ne]': '-1',
                'sort[0]': 'totalValueLocked:desc',
                'sort[1]': 'createdAt:desc',
                'populate[0]': 'image',
                'pagination[page]': page.toString(),
                'pagination[pageSize]': pageSize.toString(),
            };

            // Set the status condition based on tokenAddress
            if (type === TokenType.SENTIENT) {
                queryParams['filters[status][$in][0]'] = 'AVAILABLE';
                queryParams['filters[status][$in][1]'] = 'ACTIVATING';
            } else {
                queryParams['filters[status][$in][0]'] = 'UNDERGRAD';
            }

            // Use URLSearchParams to build the query string
            const queryString = new URLSearchParams(queryParams).toString();

            // Make the GET request to Virtuals API
            const response = await needle('get', `${this.apiUrl}?${queryString}`, {
                headers: { accept: 'application/json' }
            });

            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch token lists. Status code: ${response.statusCode}`);
            }

            // Map the response data to match the TokenList structure
            return response.body.data.map((item: Token) => ({
                id: item.id ?? 0,
                name: item.name ?? '',
                status: item.status ?? '',
                tokenAddress: item.tokenAddress ?? '',
                description: item.description ?? '',
                lpAddress: item.lpAddress ?? '',
                symbol: item.symbol ?? '',
                holderCount: item.holderCount ?? 0,
                mcapInVirtual: item.mcapInVirtual ?? 0,
                socials: {
                    x: item.socials?.x ?? '',
                    TWITTER: item.socials?.TWITTER ?? '',
                    VERIFIED_LINKS: {
                        TWITTER: item.socials?.VERIFIED_LINKS?.TWITTER ?? '',
                    },
                },
                image: {
                    id: item.image?.id ?? 0,
                    url: item.image?.url ?? '',
                }
            }));

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching token lists.';
            throw new Error(`Error fetching token lists: ${errorMessage}`);
        }
    }

    public async fetchTokenLists(): Promise<TokenList> {
        try {
            const response = await needle('get', this.apiUrl, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch token lists. Status code: ${response.statusCode}`);
            }

            return response.body as TokenList;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error fetching token lists: ${error.message}`);
            } else {
                throw new Error('An unknown error occurred while fetching token lists.');
            }
        }
    }
}

export default VirtualApiManager;
