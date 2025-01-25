import { SDKClient } from 'vp-trade-sdk/sdkClient';
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

        /**
         * Example of buying sentient tokens
         */
        const amountToBuy = '0.01'; // amount of virtual token to use to buy sentient token
        // Check if the allowance is enough to buy 0.01 sentient token
        const isBuyingSentientAllowanceEnough = await sdkClient.checkSentientAllowance(amountToBuy);
        if (isBuyingSentientAllowanceEnough) {
            // Buy the 0.01 sentient token if the allowance is enough
            await sdkClient.buySentientTokens("<SENTIENT_TOKEN>", amountToBuy);
            console.log('0.01 sentient token bought successfully');
        } else {
            console.log('Allowance is not enough to buy 0.01 sentient token');

            // Approve the allowance to buy 0.01 sentient token if the allowance is not enough
            // Approve allowance using virtual token address (default value of `fromTokenAddress`) during sentient token buying
            await sdkClient.approveSentientAllowance(amountToBuy);

            // Buy the 0.01 sentient token after approved
            await sdkClient.buySentientTokens("<SENTIENT_TOKEN>", amountToBuy);
        }

        /**
         * Example of selling sentient tokens
         */
        const amountToSell = '0.01'; // amount of sentient token to sell
        // Check if the allowance is enough to sell 0.01 sentient token
        const isSellingSentientAllowanceEnough = await sdkClient.checkSentientAllowance(amountToSell, "<SENTIENT_TOKEN>");
        if (isSellingSentientAllowanceEnough) {
            // Sell 0.01 sentient token obtained above
            await sdkClient.sellSentientTokens("<SENTIENT_TOKEN>", amountToSell);
            console.log('0.01 sentient token sold successfully');
        } else {
            console.log('Allowance is not enough to sell 0.01 sentient token');

            // Approve the allowance to buy 0.01 sentient token if the allowance is not enough
            // Approve allowance on sentient token address during selling sentient token
            await sdkClient.approveSentientAllowance(amountToSell, "<SENTIENT_TOKEN>");

            // Sell the 0.01 sentient token after approve - sentient token address
            await sdkClient.sellSentientTokens("<SENTIENT_TOKEN>", amountToSell);
        }

        /**
         * Example of buying prototype tokens
         */
        const amountToBuyPrototype = '0.01'; // amount of virtual token to use to buy prototype token
        // Check if the allowance is enough to buy 0.01 prototype token
        const isBuyingPrototypeAllowanceEnough = await sdkClient.checkPrototypeAllowance(amountToBuyPrototype);
        if (isBuyingPrototypeAllowanceEnough) {
            // Buy the 0.01 prototype token obtained above
            await sdkClient.buyPrototypeTokens("<PROTOTYPE_TOKEN_ADDRESS>", amountToBuyPrototype);
            console.log('0.01 prototype token bought successfully');
        } else {
            console.log('Allowance is not enough to buy 0.01 prototype token');

            // Approve the allowance to buy 0.01 prototype token if the allowance is not enough
            // Approve allowance using virtual token address (default value of `fromTokenAddress`) during prototype token buying
            await sdkClient.approvePrototypeAllowance(amountToBuyPrototype);

            // Buy the 0.01 prototype token after approve
            await sdkClient.buyPrototypeTokens("<PROTOTYPE_TOKEN_ADDRESS>", amountToBuyPrototype);
        }


        /**
         * Example of selling prototype tokens
         */
        const amountToSellPrototype = '0.01'; 
        // Check if the allowance is enough to sell 0.01 prototype token
        const isSellingPrototypeAllowanceEnough = await sdkClient.checkPrototypeAllowance(amountToSellPrototype, "<PROTOTYPE_TOKEN_ADDRESS>");
        if (isSellingPrototypeAllowanceEnough) {
            // Sell 0.01 prototype token obtained above
            await sdkClient.sellPrototypeTokens("<PROTOTYPE_TOKEN_ADDRESS>", amountToSellPrototype);
            console.log('0.01 prototype token sold successfully');
        } else {
            console.log('Allowance is not enough to sell 0.01 prototype token');

            // Approve the allowance to buy 0.01 prototype token - prototype token address
            await sdkClient.approvePrototypeAllowance(amountToSellPrototype, "<PROTOTYPE_TOKEN_ADDRESS>");

            // Sell the 0.01 prototype token after approve - prototype token address
            await sdkClient.sellPrototypeTokens("<PROTOTYPE_TOKEN_ADDRESS>", amountToSellPrototype);
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
