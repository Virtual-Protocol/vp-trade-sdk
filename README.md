## Installation

```bash
npm install 
```

## Usage

### 1. Initialize the SDK Client

The `SDKClient` requires a configuration object to initialize. Ensure you provide the necessary values like `privateKey`, `rpcUrl`, `apiKey`, and `virtualApiUrl`.

```javascript
import { SDKClient } from 'vp-trade-sdk';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.RPC_PROVIDER_URL || '',
    apiKey: process.env.RPC_API_KEY || '',
    virtualApiUrl: process.env.VIRTUALS_API_URL || '',
};

const sdkClient = new SDKClient(config);
```

### 2. Example: Buy the Highest Total Value Locked Prototype Token

```javascript
    try {
        // Get prototype tokens sorted by total value locked
        const prototypeTokens = await sdkClient.getPrototypeListing();
        const highestTokenAddress = prototypeTokens.tokens[0].tokenAddress;

        // Fetch token details
        const tokenDetails = await sdkClient.fetchToken(highestTokenAddress);
        console.log('Highest Total Value Locked Prototype Token:', tokenDetails);

        // Check allowance to buy 0.01 of the token
        const amountToBuy = '0.01';
        const isAllowanceSufficient = await sdkClient.checkPrototypeAllowance(amountToBuy, highestTokenAddress);

        if (!isAllowanceSufficient) {
            console.log('Approving allowance...');
            await sdkClient.approvePrototypeAllowance(amountToBuy, highestTokenAddress);
        }

        // Buy the token
        const transactionReceipt = await sdkClient.buyPrototypeTokens(highestTokenAddress, amountToBuy);
        console.log('Transaction Receipt:', transactionReceipt);
    } catch (error) {
        console.error('Error:', error);
    }
```

### 3. Other Examples

#### Get Wallet Address

```javascript
const walletAddress = sdkClient.getAddress();
console.log('Wallet Address:', walletAddress);
```

#### Sign a Message

```javascript
const signedMessage = await sdkClient.signMessage('Hello, blockchain!');
console.log('Signed Message:', signedMessage);
```

#### Get Sentient Token Listings

```javascript
const sentientTokens = await sdkClient.getSentientListing();
console.log('Sentient Tokens:', sentientTokens);
```

#### Approve Token Allowance

```javascript
await sdkClient.approveSentientAllowance('0.05', '0xTokenAddress');
console.log('Allowance approved!');
```

## Configuration Object

The `ClientConfig` object requires the following parameters:

| Parameter       | Type   | Description                                         |
| --------------- | ------ | --------------------------------------------------- |
| `privateKey`    | string | Private key of the wallet for signing transactions. |
| `rpcUrl`        | string | RPC URL for blockchain communication.               |
| `apiKey`        | string | API key for RPC provider.                           |
| `virtualApiUrl` | string | URL for the Virtual API endpoint.                   |

## API Reference

### SDKClient

#### Methods

- `getAddress(): string`

  - Returns the wallet's address.

- `signMessage(message: string): Promise<string>`

  - Signs a message using the wallet's private key.

- `buyPrototypeTokens(tokenAddress: string, amount: string, option?: Option): Promise<TransactionReceipt>`

  - Buys Prototype tokens from Virtuals.

- `sellPrototypeTokens(tokenAddress: string, amount: string, option?: Option): Promise<TransactionReceipt>`

  - Sells Prototype tokens to Virtuals.

- `buySentientTokens(tokenAddress: string, amount: string, builderID?: number): Promise<TransactionReceipt>`

  - Buys Sentient tokens from Virtuals.

- `sellSentientTokens(tokenAddress: string, amount: string, builderID?: number): Promise<TransactionReceipt>`

  - Sells Sentient tokens to Virtuals.

- `getPrototypeListing(pageNumber?: number, pageSize?: number): Promise<TokenList>`

  - Retrieves a list of Prototype tokens sorted by highest total value locked.

- `getSentientListing(pageNumber?: number, pageSize?: number): Promise<TokenList>`

  - Retrieves a list of Sentient tokens sorted by highest total value locked.

- `fetchToken(tokenAddress: string): Promise<Token>`

  - Fetches details of a specific token by its address.

- `checkPrototypeAllowance(amountInWei: string, fromTokenAddress: string): Promise<boolean>`

  - Checks Prototype token allowance.

- `approvePrototypeAllowance(amountInWei: string, fromTokenAddress: string): Promise<string>`

  - Approves Prototype token allowance.

- `checkSentientAllowance(amountInWei: string, fromTokenAddress: string): Promise<boolean>`

  - Checks Sentient token allowance.

- `approveSentientAllowance(amountInWei: string, fromTokenAddress: string): Promise<string>`

  - Approves Sentient token allowance.


## License



