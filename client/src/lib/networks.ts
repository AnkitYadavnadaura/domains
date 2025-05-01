// Network configurations

export interface NetworkConfig {
  chainId: string;          // Hex chain ID
  chainIdDecimal: number;   // Decimal chain ID
  name: string;             // Display name
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  icon?: string;            // Icon for UI display
  testnet: boolean;         // Is this a testnet?
}

export const SUPPORTED_NETWORKS: { [key: string]: NetworkConfig } = {
  // Ethereum Mainnet
  ethereum: {
    chainId: '0x1',
    chainIdDecimal: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/'],
    testnet: false,
  },
  
  // Ethereum Testnets
  sepolia: {
    chainId: '0xaa36a7',
    chainIdDecimal: 11155111,
    name: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
    testnet: true,
  },
  goerli: {
    chainId: '0x5',
    chainIdDecimal: 5,
    name: 'Goerli Testnet',
    nativeCurrency: {
      name: 'Goerli ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://goerli.infura.io/v3/'],
    blockExplorerUrls: ['https://goerli.etherscan.io/'],
    testnet: true,
  },
  
  // Polygon Networks
  polygon: {
    chainId: '0x89',
    chainIdDecimal: 137,
    name: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/'],
    testnet: false,
  },
  polygonMumbai: {
    chainId: '0x13881',
    chainIdDecimal: 80001,
    name: 'Polygon Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
    testnet: true,
  },
  
  // Optimism Networks
  optimism: {
    chainId: '0xa',
    chainIdDecimal: 10,
    name: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io/'],
    testnet: false,
  },
  optimismGoerli: {
    chainId: '0x1a4',
    chainIdDecimal: 420,
    name: 'Optimism Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://goerli.optimism.io'],
    blockExplorerUrls: ['https://goerli-optimism.etherscan.io/'],
    testnet: true,
  },
  
  // Arbitrum Networks
  arbitrum: {
    chainId: '0xa4b1',
    chainIdDecimal: 42161,
    name: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io/'],
    testnet: false,
  },
  arbitrumGoerli: {
    chainId: '0x66eed',
    chainIdDecimal: 421613,
    name: 'Arbitrum Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://goerli-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://goerli.arbiscan.io/'],
    testnet: true,
  },
  
  // Base Networks
  base: {
    chainId: '0x2105',
    chainIdDecimal: 8453,
    name: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org/'],
    testnet: false,
  },
  baseGoerli: {
    chainId: '0x14a33',
    chainIdDecimal: 84531,
    name: 'Base Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://goerli.base.org'],
    blockExplorerUrls: ['https://goerli.basescan.org/'],
    testnet: true,
  },
};

// Network switching and detection
export const DEFAULT_NETWORK = 'sepolia'; // Default to Sepolia testnet

// Get current network key based on chainId
export function getNetworkByChainId(chainId: string | number): string | null {
  if (typeof chainId === 'number') {
    // If decimal, convert to hex
    chainId = '0x' + chainId.toString(16);
  }
  
  for (const [key, network] of Object.entries(SUPPORTED_NETWORKS)) {
    if (network.chainId.toLowerCase() === chainId.toLowerCase()) {
      return key;
    }
  }
  
  return null;
}

// Get network configuration object for a network key
export function getNetworkConfig(networkKey: string): NetworkConfig | null {
  return SUPPORTED_NETWORKS[networkKey] || null;
}

// Get all mainnet networks
export function getMainnetNetworks(): { [key: string]: NetworkConfig } {
  return Object.entries(SUPPORTED_NETWORKS)
    .filter(([_, config]) => !config.testnet)
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {} as { [key: string]: NetworkConfig });
}

// Get all testnet networks
export function getTestnetNetworks(): { [key: string]: NetworkConfig } {
  return Object.entries(SUPPORTED_NETWORKS)
    .filter(([_, config]) => config.testnet)
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {} as { [key: string]: NetworkConfig });
}