import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { web3Modal } from '@/lib/wagmiConfig';
import { shortenAddress } from '@/lib/web3';
import { getNetworkByChainId, getNetworkConfig } from '@/lib/networks';

interface Web3ModalButtonProps {
  isMobile?: boolean;
}

const Web3ModalButton = ({ isMobile = false }: Web3ModalButtonProps) => {
  // Use Wagmi hooks directly for better reliability
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [networkInfo, setNetworkInfo] = useState<{ name: string; testnet: boolean } | null>(null);

  // Get network information based on chain ID
  useEffect(() => {
    if (chainId) {
      const networkKey = getNetworkByChainId(chainId);
      if (networkKey) {
        const config = getNetworkConfig(networkKey);
        if (config) {
          setNetworkInfo({
            name: config.name,
            testnet: config.testnet
          });
        } else {
          setNetworkInfo({ name: "Unknown Network", testnet: false });
        }
      } else {
        setNetworkInfo({ name: "Unknown Network", testnet: false });
      }
    } else {
      setNetworkInfo(null);
    }
  }, [chainId]);

  const buttonClasses = isMobile 
    ? "w-full" 
    : "rounded-full";

  const handleConnect = () => {
    web3Modal.open();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div>
      {isConnected && address ? (
        <div className="flex items-center gap-2">
          {networkInfo && (
            <div className={`hidden sm:flex items-center text-xs px-2 py-1 rounded-full ${
              networkInfo.testnet ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
            }`}>
              {networkInfo.name}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className={`${buttonClasses} bg-primary/10 text-primary hover:bg-primary/20`}
            onClick={handleDisconnect}
          >
            {shortenAddress(address)}
          </Button>
        </div>
      ) : (
        <Button
          className={buttonClasses}
          onClick={handleConnect}
          variant="default"
          size="sm"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default Web3ModalButton;