# Blockchain DNS Management System

A blockchain-based domain name system that allows users to register domains as NFTs and manage subdomains with a modern Web3 interface.

## Features

- Register domain names as NFTs on the Ethereum blockchain (Sepolia Testnet)
- Create and manage subdomains for your registered domains
- Support for multiple TLDs (.eth, .com, .org, .in, .tech, .app)
- Smart contract integration with the frontend application
- Wallet connectivity with MetaMask

## Smart Contract Deployment Instructions

The application includes a smart contract (`DomainRegistry.sol`) that needs to be deployed to the Sepolia testnet. Follow these steps to deploy the contract:

### Prerequisites

1. Ensure you have a MetaMask wallet with Sepolia ETH
   - You can get Sepolia ETH from faucets like [Sepolia Faucet](https://sepoliafaucet.com/)

2. Create an API key from a provider (like Alchemy or Infura) for Sepolia network access

3. (Optional) Get an Etherscan API key if you want to verify the contract on Etherscan

### Deployment Steps

1. Add your environment variables to the `.env` file:
   ```
   PRIVATE_KEY=your_wallet_private_key
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

2. Deploy the contract with Hardhat:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. After successful deployment, update the `.env` file with the contract address:
   ```
   VITE_CONTRACT_ADDRESS=your_deployed_contract_address
   ```

4. Restart the application to use the deployed contract

## Smart Contract Details

The `DomainRegistry` smart contract has the following features:

- ERC721-based NFT standard for domain ownership
- Multi-TLD support with different pricing tiers
- Subdomain management (create, transfer, deactivate)
- Domain renewal functionality
- Price calculation based on domain name length and TLD

## Frontend Integration

The frontend application automatically integrates with the deployed smart contract by:

1. Checking domain availability on the blockchain
2. Calculating accurate registration fees
3. Registering domains through blockchain transactions
4. Managing your subdomains with blockchain verification

## Development and Testing

During development, if the contract is not yet deployed (or you're not connected to Sepolia), the application will:

1. Use mockup data for domain availability
2. Simulate blockchain transactions
3. Store domain data in the application database

This allows for development and testing without requiring a deployed contract.

## Running the Application

```
npm run dev
```

This starts both the backend server and frontend application.

## Frontend Technologies

- React with TypeScript
- TanStack Query for data fetching
- Ethers.js for blockchain interaction
- Tailwind CSS with Shadcn UI components
- Wouter for routing

## Backend Technologies

- Express.js server
- In-memory storage (for development)
- RESTful API endpoints

## Blockchain Technologies

- Solidity smart contract
- Hardhat for development, testing, and deployment
- OpenZeppelin contracts for security and standards
- Ethers.js for contract interaction