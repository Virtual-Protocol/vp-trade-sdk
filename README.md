## Installation

```bash
npm install 
```

## Usage

### 1. Configure Environment Variables
Before using the SDK, ensure that you configure your environment variables by replacing the placeholders with your keys and URLs in `.env`:

```
PRIVATE_KEY={replace with your wallet's private key}
RPC_PROVIDER_URL={replace with your RPC provider's url}
RPC_API_KEY={replace with your RPC API key here}
VIRTUALS_API_URL=https://api.virtuals.io/api/virtuals
```

### 2. Initialize the SDK Client

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

### 3. Example: Buy a sentient token

```javascript
import { SDKClient } from 'vp-trade-sdk';

const config = {
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.RPC_PROVIDER_URL || '',
    apiKey: process.env.RPC_API_KEY || '',
    virtualApiUrl: process.env.VIRTUALS_API_URL || '',
};

const sdkClient = new SDKClient(config);

async function exampleBuyingSentientToken() {
    // Buy Sentient Tokens
    const amountToBuy = '0.01';
    const isBuyingAllowanceEnough = await sdkClient.checkSentientAllowance(amountToBuy);
    
    if (isBuyingAllowanceEnough) {
        await sdkClient.buySentientTokens("<SENTIENT_TOKEN>", amountToBuy);
    } else {
        await sdkClient.approveSentientAllowance(amountToBuy);
        await sdkClient.buySentientTokens("<SENTIENT_TOKEN>", amountToBuy);
    }
}
```

### 4. Other Examples

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

## Configuration Object

The `ClientConfig` object requires the following parameters:

| Parameter       | Type   | Description                                         |
| --------------- | ------ | --------------------------------------------------- |
| `privateKey`    | string | Private key of the wallet for signing transactions. |
| `rpcUrl`        | string | RPC URL for blockchain communication.               |
| `apiKey`        | string | API key for RPC provider.                           |
| `virtualApiUrl` | string | URL for the Virtual API endpoint.                   |


## Methods

### Token Transactions

- `buySentientTokens(tokenAddress: string, amount: string)`: Buy Sentient tokens
- `sellSentientTokens(tokenAddress: string, amount: string)`: Sell Sentient tokens
- `buyPrototypeTokens(tokenAddress: string, amount: string)`: Buy Prototype tokens
- `sellPrototypeTokens(tokenAddress: string, amount: string)`: Sell Prototype tokens

### Allowance Management

- `checkSentientAllowance(amount: string, fromTokenAddress?)`: Check Sentient token allowance
- `approveSentientAllowance(amount: string, fromTokenAddress?)`: Approve Sentient token allowance
- `checkPrototypeAllowance(amount: string, fromTokenAddress?)`: Check Prototype token allowance
- `approvePrototypeAllowance(amount: string, fromTokenAddress?)`: Approve Prototype token allowance

### Token Listing

- `getSentientListing(pageNumber?: number, pageSize?: number)`: Get Sentient token listings
- `getPrototypeListing(pageNumber?: number, pageSize?: number)`: Get Prototype token listings
- `fetchToken(tokenAddress: string)`: Fetch token details by address



## License



