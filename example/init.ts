import { SDKClient } from '../src/sdkClient';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    privateKey: process.env.ACCOUNT_PRIVATE_KEY || '',
    rpcUrl: process.env.RPC_PROVIDER_URL || '',
    apiKey: process.env.VIRTUALS_API_KEY || '',
    virtualApiUrl: process.env.VIRTUALS_API_URL || '',
    virtualApiKey: process.env.VIRTUALS_API_KEY || ''
};

const sdkClient = new SDKClient(config);
async function main() {
    try {
        console.log('Wallet Address:', sdkClient.getAddress());
        const txReceipt = await sdkClient.sendEther('0.01'); 
        console.log('Transaction Receipt:', txReceipt);

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
