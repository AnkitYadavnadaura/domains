import { ReactNode, useEffect } from 'react';
import { WagmiProvider, createConfig } from 'wagmi';
import { config } from '@/lib/wagmiConfig';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for wagmi
const queryClient = new QueryClient();

interface WagmiProviderWrapperProps {
  children: ReactNode;
}

export function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  // Get and initialize the current configuration and environment
  useEffect(() => {
    // Check that the environment variables are properly loaded
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      console.warn('WalletConnect Project ID is not set. Web3Modal may not work properly.');
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}