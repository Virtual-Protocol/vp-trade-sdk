import needle from 'needle';
import dotenv from 'dotenv';

dotenv.config();

export const fetchTokenLists = async () => {
    const virtualsApiUrl = process.env.VIRTUALS_API_URL;
    if (!virtualsApiUrl) throw new Error('Virtuals API URL is missing in .env file');
    const apiKey = process.env.VIRTUALS_API_KEY;
    if (!apiKey) throw new Error('Virtuals API key is missing in .env file');

    try {
        const response = await needle('get', virtualsApiUrl, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.statusCode !== 200) {
            throw new Error(`Failed to fetch token lists. Status code: ${response.statusCode}`);
        }

        return response.body;
    } catch (error) {
        throw new Error(`Error fetching token lists: ${error}`);
    }
};
