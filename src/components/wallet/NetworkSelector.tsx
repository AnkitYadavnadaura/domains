import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_NETWORKS, getNetworkByChainId, getNetworkConfig } from '@/lib/networks';
import { ChevronDown, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

// Export a standalone function for switching networks that can be used outside of React components
export async function switchNetwork(networkKey: string): Promise<boolean> {
  if (!window.ethereum) {
    console.error('No Ethereum provider available');
    return false;
  }

  const networkConfig = getNetworkConfig(networkKey);
  if (!networkConfig) {
    console.error(`Network config not found for ${networkKey}`);
    return false;
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: networkConfig.chainId,
              chainName: networkConfig.name,
              nativeCurrency: networkConfig.nativeCurrency,
              rpcUrls: networkConfig.rpcUrls,
              blockExplorerUrls: networkConfig.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network to wallet:', addError);
        return false;
      }
    } else {
      console.error('Error switching network:', switchError);
      return false;
    }
  }
}

const NetworkSelector = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchNetwork = async (networkKey: string) => {
    const networkConfig = getNetworkConfig(networkKey);
    if (!networkConfig) {
      console.error(`Network config not found for ${networkKey}`);
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert hex chainId to number
      const chainIdNumber = parseInt(networkConfig.chainId, 16);
      
      // Use wagmi's switchChain function
      await switchChain({ chainId: chainIdNumber });
      
      toast({
        title: 'Network Switched',
        description: `You are now connected to ${networkConfig.name}`,
      });
    } catch (error: any) {
      console.error('Error switching network:', error);
      toast({
        title: 'Network Switch Failed',
        description: error.message || 'There was an error switching networks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get current network name based on chain ID
  const getCurrentNetworkName = (): string => {
    if (!chainId && !isConnected) return 'No Network';
    
    // Convert number chainId to hex string for our lookup function
    const chainIdHex = '0x' + chainId.toString(16);
    
    const networkKey = getNetworkByChainId(chainIdHex);
    if (!networkKey) return 'Unknown Network';
    
    return SUPPORTED_NETWORKS[networkKey].name;
  };

  const renderNetworkList = (testnet: boolean) => {
    return Object.entries(SUPPORTED_NETWORKS)
      .filter(([_, config]) => config.testnet === testnet)
      .map(([key, config]) => {
        // Convert hex chainId to number for comparison with wagmi's chainId
        const configChainIdNumber = parseInt(config.chainId, 16);
        
        return (
          <DropdownMenuItem 
            key={key}
            onClick={() => handleSwitchNetwork(key)}
            className={cn(
              "cursor-pointer flex items-center gap-2 px-4 py-2",
              chainId === configChainIdNumber && "bg-secondary/10"
            )}
          >
            <span className="text-sm font-medium">{config.name}</span>
            {chainId === configChainIdNumber && (
              <span className="ml-auto w-2 h-2 rounded-full bg-green-500"></span>
            )}
          </DropdownMenuItem>
        );
      });
  };

  const isSwitching = isPending || isLoading;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 h-10 px-4 py-2 rounded-xl neumorphic-btn"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="hidden md:inline-block">
            {getCurrentNetworkName()}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] p-2">
        <div className="font-medium text-xs text-gray-500 px-2 py-1">MAINNETS</div>
        {renderNetworkList(false)}
        
        <Separator className="my-2" />
        
        <div className="font-medium text-xs text-gray-500 px-2 py-1">TESTNETS</div>
        {renderNetworkList(true)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NetworkSelector;