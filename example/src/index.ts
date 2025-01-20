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
        // console.log('Fetched Prototype Token List:', await sdkClient.getPrototypeListing());

        // default page number - 1, page size - 10
        // console.log('Fetched Sentinent Token List:', await sdkClient.getSentinentListing());

        // test swap sentient
        // const GAMESentienttTokenAddress = '0x1C4CcA7C5DB003824208aDDA61Bd749e55F463a3';
        // const amount = '0.01';
        // const receipt = await sdkClient.swapInSentientTokens(GAMESentienttTokenAddress, amount);
        // console.log('Sentient txn receipt: ', receipt); 

        const GAMESentienttTokenAddress = '0x1C4CcA7C5DB003824208aDDA61Bd749e55F463a3';
        const amount = '0.01';
        const receipt = await sdkClient.swapOutSentientTokens(GAMESentienttTokenAddress, amount);
        console.log('Sentient Swap Out txn receipt: ', receipt); 

        // const TRUMPAGENTPrototype = '0x069E372EE0164c4D50F6F789f07fDE286DdB524C';
        // const amount = '0.01';
        // const receipt = await sdkClient.buyPrototypeTokens(TRUMPAGENTPrototype, amount);
        // console.log('Buy Prototype txn receipt: ', receipt); 

        // const receipt = await sdkClient.sellPrototypeTokens(TRUMPAGENTPrototype, '1649.997277');
        // console.log('Sell Prototype txn receipt: ', receipt); 

        // console.log('Fetch by address:', await sdkClient.fetchToken('0x5E8639baE1009E099d566007Bc1C4A6B55F7DB8e'));

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
