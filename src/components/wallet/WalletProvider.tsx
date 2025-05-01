import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { web3Modal } from '@/lib/wagmiConfig';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  address: null,
  connect: async () => {},
  disconnect: async () => {},
});

// Create a custom hook to access the wallet context
export function useWallet() {
  return useContext(WalletContext);
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { toast } = useToast();
  
  const [directWalletStatus, setDirectWalletStatus] = useState({
    isDirectlyConnected: false,
    directAddress: null as string | null,
  });

  // Check for direct wallet connection via window.ethereum
  useEffect(() => {
    const checkDirectWalletConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        return;
      }
      
      try {
        // Check if already authorized
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          setDirectWalletStatus({
            isDirectlyConnected: true,
            directAddress: accounts[0],
          });
          console.log('Direct wallet connection detected:', accounts[0]);
        }
      } catch (error) {
        console.error('Error checking direct wallet connection:', error);
      }
    };
    
    checkDirectWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setDirectWalletStatus({
            isDirectlyConnected: false,
            directAddress: null,
          });
        } else {
          setDirectWalletStatus({
            isDirectlyConnected: true,
            directAddress: accounts[0],
          });
        }
      });
    }
    
    return () => {
      // Cleanup listener
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  // Connect to wallet using Web3Modal
  const connect = async () => {
    try {
      // Log connection attempt
      console.log("Attempting to connect wallet via Web3Modal");
      
      // Open Web3Modal to initiate connection
      web3Modal.open();
      
      // Note: The actual connection is handled by the modal itself,
      // and results will be tracked via Wagmi hooks and our state monitoring
    } catch (error: any) {
      console.error("Web3Modal connection error:", error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to open Web3Modal",
        variant: "destructive",
      });
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    try {
      await wagmiDisconnect();
      
      // Also disconnect direct connection if exists
      if (window.ethereum && window.ethereum.disconnect) {
        try {
          await window.ethereum.disconnect();
        } catch (e) {
          // Some wallets don't support disconnect
          console.log('Direct disconnect not supported by this wallet');
        }
      }
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error: any) {
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  // Combine both connection methods
  const effectiveIsConnected = isConnected || directWalletStatus.isDirectlyConnected;
  const effectiveAddress = address || directWalletStatus.directAddress;

  // Show toast on connection
  useEffect(() => {
    if (effectiveIsConnected && effectiveAddress) {
      console.log('Wallet connected:', { 
        wagmi: { isConnected, address },
        direct: directWalletStatus
      });
      
      toast({
        title: "Wallet connected",
        description: "Your wallet has been connected successfully.",
      });
    }
  }, [effectiveIsConnected, effectiveAddress, toast]);

  const value = {
    isConnected: effectiveIsConnected,
    isConnecting,
    address: effectiveAddress,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};