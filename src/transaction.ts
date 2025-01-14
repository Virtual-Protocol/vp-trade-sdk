import { ethers } from 'ethers';
import { initWallet } from './wallet';
import { connectProvider } from './provider';

export const createTransaction = async (
    to: string,
    value: ethers.BigNumberish
): Promise<string> => {
    const wallet = initWallet();
    const provider = connectProvider();
    const connectedWallet = wallet.connect(provider);

    const tx: ethers.TransactionRequest = {
        to,
        value: ethers.parseEther(value.toString()),
        gasLimit: ethers.toBeHex(21000),
    };

    return connectedWallet.signTransaction(tx);
};

export const sendTransaction = async (
    signedTx: string
): Promise<ethers.TransactionResponse> => {
    const provider = connectProvider();
    return provider.broadcastTransaction(signedTx);
};
