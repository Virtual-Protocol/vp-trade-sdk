import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export const initWallet = (): ethers.Wallet => {
  const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
  if (!privateKey) throw new Error('Private key is not configured in .env file');
  return new ethers.Wallet(privateKey);
};
