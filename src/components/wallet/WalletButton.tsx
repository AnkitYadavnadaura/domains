import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/web3";
import { Loader2 } from "lucide-react";

interface WalletButtonProps {
  isMobile?: boolean;
}

const WalletButton = ({ isMobile = false }: WalletButtonProps) => {
  const { isConnected, address, isConnecting, connect } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error: any) {
      console.error("Failed to connect wallet:", error.message);
    }
  };

  if (isConnected && address) {
    return (
      <div className="neumorphic py-2 px-4 rounded-full flex items-center space-x-3">
        <div className="w-3 h-3 bg-success rounded-full"></div>
        <span className="text-sm font-medium truncate">{shortenAddress(address)}</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`neumorphic-button bg-primary text-white font-medium py-2 px-6 rounded-full transition ${
        isMobile ? "w-full" : ""
      }`}
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Wallet"
      )}
    </Button>
  );
};

export default WalletButton;
