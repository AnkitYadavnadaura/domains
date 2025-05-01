import { createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { injected, walletConnect } from '@wagmi/connectors';
import { createWeb3Modal } from '@web3modal/wagmi';

// Your project ID from WalletConnect Cloud
// You can get it from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Create wagmi config
export const config = createConfig({
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
});

// Create Web3Modal with custom theme
export const web3Modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains: [sepolia, mainnet],
  themeMode: 'light',
  // Custom theme - we use ts-ignore because the type definition is not up-to-date
  // @ts-ignore
  themeVariables: {
    // Primary color for accent elements
    '--w3m-accent-color': '#6366F1', 
    // Background color for the modal
    '--w3m-background-color': '#F8FAFC',
  },
});