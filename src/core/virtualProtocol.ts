import dotenv from 'dotenv';
import needle from 'needle';

dotenv.config();

interface TokenList {
    tokens: Array<{
        address: string;
    }>;
}

interface VirtualApiConfig {
    apiUrl: string;
    apiKey: string;
}

class VirtualApiManager {
    private apiUrl: string;
    private apiKey: string;

    constructor(config: VirtualApiConfig) {

        if (!config.apiUrl) {
            throw new Error('Virtuals API URL cannot be empty');
        };
        if (!config.apiKey) {
            throw new Error('Virtuals API key cannot be empty');
        }

        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey;
    }

    /**
     * Fetch the token lists from the Virtuals API.
     * @returns The token list data.
     */
    public async fetchTokenLists(): Promise<TokenList> {
        try {
            const response = await needle('get', this.apiUrl, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
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
