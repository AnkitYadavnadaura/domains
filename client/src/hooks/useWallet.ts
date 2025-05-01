import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "./use-toast";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { web3Modal } from "@/lib/wagmiConfig";

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  address: null,
  connect: async () => {},
  disconnect: async () => {},
});

export const useWallet = () => useContext(WalletContext);

// Wallet hook that uses Wagmi
export function useWalletStatus() {
  const { address, isConnected } = useAccount();
  const { isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { toast } = useToast();

  // Connect to wallet using Web3Modal
  const connect = async () => {
    try {
      web3Modal.open();
    } catch (error: any) {
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

  // React to connection changes
  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: "Wallet connected",
        description: "Your wallet has been connected successfully.",
      });
    }
  }, [isConnected, address, toast]);

  return {
    isConnected,
    isConnecting,
    address: address || null,
    connect,
    disconnect,
  };
}

// Simple WalletProvider that just uses Wagmi hooks directly
export function WalletProvider({ children }: { children: ReactNode }) {
  // For now, just return children
  // The wallet connection will work through web3Modal/Wagmi
  return children as JSX.Element;
}