import dotenv from 'dotenv';
import needle from 'needle';
import { TokenType } from './../constant';

dotenv.config();

interface TokenList {
    tokens: Token[];
}

interface Token {
    name: string;
    address: string;
    tokenAddress: string;
    daoAddress: string;
    tbaAddress: string
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

    public async fetchVirtualTokensByAddress(tokenAddress: string): Promise<TokenList> {
        try {
            // Construct query parameters dynamically into a flat query object
            const params: Record<string, string> = {
                'filters[status][$in][0]': 'AVAILABLE',
                'filters[status][$in][1]': 'ACTIVATING',
                'filters[status][$in][2]': 'UNDERGRAD',
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

            // Make the GET request to Virtuals API
            const response = await needle('get', this.apiUrl, {
                query: params, headers: { accept: 'application/json' }
            });

            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch token lists. Status code: ${response.statusCode}`);
            }

            // Map the response data to match the TokenList structure
            return response.body.data.map((item: Token) => ({
                name: item.name,
                tokenAddress: item.tokenAddress,
                daoAddress: item.daoAddress,
                tbaAddress: item.tbaAddress,
            }));

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching token lists.';
            throw new Error(`Error fetching token lists: ${errorMessage}`);
        }

    }

    /**
     * Fetch the token lists from the Virtuals API.
     * @param type The type of the virtual listing ('prototype' or 'sentinent').
     * @param page The page number for pagination.
     * @param pageSize The page size for pagination.
     * @returns The token list data.
     */

    public async fetchVirtualTokenLists(type: string, page: number, pageSize: number): Promise<TokenList> {
        try {

            // Define status based on the type
            let virtualStatus: string[] = [];
            if (type === TokenType.PROTOTYPE) {
                virtualStatus = ['UNDERGRAD']; // Single status for prototype
            } else if (type === TokenType.SENTIENT) {
                virtualStatus = ['AVAILABLE', 'ACTIVATING']; // Two statuses for sentinent
            } else {
                throw new Error(`Invalid token type provided: ${type}. Expected 'PROTOTYPE' or 'SENTIENT'.`);
            }

            // Construct query parameters dynamically into a flat query object
            const params: Record<string, string> = {
                'filters[status][$in][0]': virtualStatus[0],
                'filters[priority][$ne]': '-1',
                'sort[0]': 'totalValueLocked:desc',
                'sort[1]': 'createdAt:desc',
                'populate[0]': 'image',
                'pagination[page]': page.toString(),
                'pagination[pageSize]': pageSize.toString(),
            };

            // If there are more than 1 statuses for the given type, append them
            if (virtualStatus.length > 1) {
                virtualStatus.forEach((status, index) => {
                    params[`filters[status][$in][${index}]`] = status;
                });
            }

            // Make the GET request to Virtuals API
            const response = await needle('get', this.apiUrl, {
                query: params, headers: { accept: 'application/json' }
            });

            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch token lists. Status code: ${response.statusCode}`);
            }

            // Map the response data to match the TokenList structure
            return response.body.data.map((item: Token) => ({
                name: item.name,
                tokenAddress: item.tokenAddress,
                daoAddress: item.daoAddress,
                tbaAddress: item.tbaAddress,
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
