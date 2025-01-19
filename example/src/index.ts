import { SDKClient } from 'vp-trade-sdk/sdkClient';
import dotenv from 'dotenv';
import { TransactionReceipt } from 'ethers';
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
        console.log('Wallet Address:', sdkClient.getAddress());

        // default page number - 1, page size - 10
        const prototypeList = await sdkClient.getPrototypeListing();
        console.log('Fetched Prototype Token List:', prototypeList);

        // default page number - 1, page size - 10
        const sentinentListing = await sdkClient.getSentinentListing();
        console.log('Fetched Sentinent Token List:', sentinentListing);

        // test swap sentient
        const GAMESentienttTokenAddress = '0x1C4CcA7C5DB003824208aDDA61Bd749e55F463a3';
        const amount = '0.01';
        const receipt = await sdkClient.swapInSentientTokens(GAMESentienttTokenAddress, amount);
        console.log('Sentient txn receipt: ', receipt); 

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
