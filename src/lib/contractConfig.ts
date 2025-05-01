import { SUPPORTED_NETWORKS } from '@/lib/networks';
import DomainRegistryABI from '@/lib/abi/DomainRegistry.json';

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Production networks
  ethereum: '', // Mainnet address (not deployed yet)
  polygon: '', // Polygon Mainnet address (not deployed yet)
  
  // Test networks
  sepolia: '0xf50649789CaEaad3c1E83D8da6D6048Ff8fE253A', // Sepolia Testnet address
  mumbai: '', // Mumbai Testnet address (not deployed yet)
};

// Get the correct contract address based on the current network
export function getContractAddress(networkKey: string): string {
  return CONTRACT_ADDRESSES[networkKey as keyof typeof CONTRACT_ADDRESSES] || '';
}

// Contract ABIs
export const CONTRACT_ABIS = {
  DomainRegistry: DomainRegistryABI,
};

// Default provider RPC URLs
export const getProviderUrl = (networkKey: string): string => {
  const network = SUPPORTED_NETWORKS[networkKey];
  return network ? network.rpcUrls[0] : '';
};

// Export contract configurations
export const contractConfig = {
  DomainRegistry: {
    abi: CONTRACT_ABIS.DomainRegistry,
    getAddress: getContractAddress,
  },
};

// Interface for contract deployment information
export interface ContractDeployment {
  network: string;
  address: string;
  blockNumber: number;
  deploymentDate: string;
}

// Contract deployment information
export const contractDeployments: ContractDeployment[] = [
  {
    network: 'sepolia',
    address: '0xf50649789CaEaad3c1E83D8da6D6048Ff8fE253A',
    blockNumber: 4788259, // Replace with actual block number if known
    deploymentDate: '2023-04-25', // Replace with actual deployment date if known
  },
];