## Installation

```bash
npm install
npm run build
cd /examples
npm install
```

## Usage

### 1. Run Example

- cd `/examples`
- create `/example/.env` file based on `/example/.env.example`
- check and update `/example/src/index.ts` file
- `npm run start`


### 2. Other Examples

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
- `searchVirtualTokensByKeyword(tokenAddress: string)`: Fetch token details by address


## Builder Fee
If you are using this SDK for getting builder fee, please contact us at [matthew@virtuals.io](mailto:matthew@virtuals.io) or [victorng@virtuals.io](mailto:victorng@virtuals.io)

## License