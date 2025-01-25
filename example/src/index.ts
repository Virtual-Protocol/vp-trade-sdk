import { SDKClient, TokenList } from 'vp-trade-sdk/sdkClient';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.RPC_PROVIDER_URL || '',
    apiKey: process.env.RPC_API_KEY || '',
    virtualApiUrl: process.env.VIRTUALS_API_URL || '',
};

const sdkClient = new SDKClient(config);

// Example to buy the highest total value locked prototype token
async function main() {
    try {

        // Get highest total value locked prototype tokens
        const prototypeTokens: TokenList = await sdkClient.getPrototypeListing();
        const highestTotalValueLockedTokenAddress = prototypeTokens.tokens[0].tokenAddress;

        // Fetch the highest total value locked prototype token
        const Token = await sdkClient.fetchToken(highestTotalValueLockedTokenAddress);
        console.log('Highest total value locked prototype token:', Token);

        // Check if the allowance is enough to buy 0.01 prototype token 
        const amountToBuy = '0.01';
        const isAllowanceEnough = await sdkClient.checkPrototypeAllowance(amountToBuy, highestTotalValueLockedTokenAddress);
        if (isAllowanceEnough) {
            // Buy the 0.01 prototype token obtained above
            await sdkClient.buyPrototypeTokens(highestTotalValueLockedTokenAddress, amountToBuy);
        } else {
            console.log('Allowance is not enough to buy 0.01 prototype token');
        }

    } catch (error) {
        // Handle any errors
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unknown error:', error);
        }
    }
}

// Call the main function to execute the example
main();
