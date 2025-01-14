import { initWallet } from './wallet';
import { connectProvider } from './provider';
import { fetchTokenLists } from './virtualsApi';
import { createTransaction, sendTransaction } from './transaction';

const main = async () => {
    try {
        // Step 1: Create wallet
        const wallet = initWallet();
        console.log('Wallet address:', wallet.address);

        // Step 2: Connect to blockchain provider
        const provider = connectProvider();
        console.log('Connected to provider:', provider._network.toJSON);

        // Step 3: Fetch token lists from Virtuals API
        const tokens = await fetchTokenLists();
        console.log('Fetched tokens:', tokens);

        // Step 4: Create and send a transaction
        const signedTx = await createTransaction(tokens[0].address, '0.01'); // Example amount
        console.log('Signed transaction:', signedTx);

        const txResponse = await sendTransaction(signedTx);
        console.log('Transaction response:', txResponse);

        const txReceipt = await txResponse.wait();
        console.log('Transaction receipt:', txReceipt);
    } catch (error) {
        console.error('Error:', error);
    }
};

main();
