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

async function main() {
    try {
        const pageNumber = 1;
        const pageSize = 10;

        const sentientTokens = await sdkClient.getSentientListing(pageNumber, pageSize);
        console.log('Sentient Tokens length:', sentientTokens.tokens.length);
        const topSentienTokenAddress = sentientTokens.tokens[0].tokenAddress;
        console.log('Highest Total Value Locked Sentient Token address:', topSentienTokenAddress);
        const topSentientTokenDetails = await sdkClient.searchVirtualTokensByKeyword(topSentienTokenAddress);
        console.log('Highest Total Value Locked Sentient Token details:', topSentientTokenDetails);

        const prototypeTokens = await sdkClient.getPrototypeListing(pageNumber, pageSize);
        console.log('Prototype Tokens length:', prototypeTokens.tokens.length);
        const topPrototypeTokenAddress = prototypeTokens.tokens[0].tokenAddress;
        console.log('Highest Total Value Locked Prototype Token address:', topPrototypeTokenAddress);
        const topPrototypeTokenDetails = await sdkClient.searchVirtualTokensByKeyword(topPrototypeTokenAddress);
        console.log('Highest Total Value Locked Prototype Token details:', topPrototypeTokenDetails);

        // exampleBuySentientToken();
        // exampleSellSentientToken();
        // exampleBuyPrototypeToken();
        // exampleSellPrototypeToken();

    } catch (error) {
        // Handle any errors
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unknown error:', error);
        }
    }
}

async function exampleBuySentientToken() {
        /**
         * Example of buying sentient tokens
         */
        // please replace with the amount of virtual token you want to use to buy sentient token
        const amountToBuy = '0.1';
        // please replace with the sentient token you want to buy
        const sentientTokenAddress = '0x55cD6469F597452B5A7536e2CD98fDE4c1247ee4' // LUNA token address
        
        // Check if the allowance is enough to buy sentient token
        const isAllowanceEnough = await sdkClient.checkSentientAllowance(amountToBuy);
        if (!isAllowanceEnough) {
            console.log('Allowance is not enough, amountToBuy: ', amountToBuy);
            // Approve the allowance now when the allowance is not enough
            await sdkClient.approveSentientAllowance(amountToBuy);
        }
        await sdkClient.buySentientTokens(sentientTokenAddress, amountToBuy);
        console.log('sentient token bought successfully, amountToBuy: ', amountToBuy);
}

async function exampleSellSentientToken() {
     /**
     * Example of selling sentient tokens
     */
    // please replace with the amount of sentient token you want to sell
    const amountToSell = '10';
    // please replace with the sentient token you want to sell
    const sentientTokenAddress = '0x55cD6469F597452B5A7536e2CD98fDE4c1247ee4' // LUNA token address
    
    // Check if the allowance is enough to sell sentient token
    const isAllowanceEnough = await sdkClient.checkSentientAllowance(amountToSell, sentientTokenAddress);
    if (!isAllowanceEnough) {
        console.log('Allowance is not enough, amountToBuy: ', amountToSell);
        // Approve the allowance now when the allowance is not enough
        await sdkClient.approveSentientAllowance(amountToSell, sentientTokenAddress);
    }
    await sdkClient.sellSentientTokens(sentientTokenAddress, amountToSell);
    console.log('sentient token sold successfully, amountToSell: ', amountToSell);
}

async function exampleBuyPrototypeToken() {
    /**
     * Example of buying prototype tokens
     */
    const amountToBuy = '0.1';
    // please replace with the prototype token you want to buy
    const prototypeTokenAddress = '0xA79F62fCE3DBf5629Cd4FD220E7DAe25235AC3b7' // $DPSAI
    
    // Check if the allowance is enough to buy prototype token
    const isAllowanceEnough = await sdkClient.checkSentientAllowance(amountToBuy);
    if (!isAllowanceEnough) {
        console.log('Allowance is not enough, amountToBuy: ', amountToBuy);
        // Approve the allowance now when the allowance is not enough
        await sdkClient.approvePrototypeAllowance(amountToBuy);
    }
    await sdkClient.buyPrototypeTokens(prototypeTokenAddress, amountToBuy);
    console.log('prototype token bought successfully, amountToBuy: ', amountToBuy);
}

async function exampleSellPrototypeToken() {
    /**
     * Example of selling prototype tokens
     */
    // please replace with the amount of prototype token you want to sell
    const amountToSell = '3000';
    // please replace with the prototype token you want to sell
    const prototypeTokenAddress = '0xA79F62fCE3DBf5629Cd4FD220E7DAe25235AC3b7' // $DPSAI
    
    // Check if the allowance is enough to sell prototype token
    const isAllowanceEnough = await sdkClient.checkSentientAllowance(amountToSell, prototypeTokenAddress);
    if (!isAllowanceEnough) {
        console.log('Allowance is not enough, amountToSell: ', amountToSell);
        // Approve the allowance now when the allowance is not enough
        await sdkClient.approvePrototypeAllowance(amountToSell, prototypeTokenAddress);
    }
    await sdkClient.sellPrototypeTokens(prototypeTokenAddress, amountToSell);
    console.log('prototype token sold successfully, amountToSell: ', amountToSell);
}

// Call the main function to execute the example
main();
