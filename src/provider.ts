import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export const connectProvider = (): ethers.JsonRpcProvider => {
    const rpcUrl = process.env.RPC_PROVIDER_URL;
    const apiKey = process.env.RPC_API_KEY;

    if (!rpcUrl || !apiKey) throw new Error('RPC configuration is missing in .env file');
    return new ethers.JsonRpcProvider(`${rpcUrl}?apiKey=${apiKey}`);
};
