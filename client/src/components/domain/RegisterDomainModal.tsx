import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { web3Modal } from "@/lib/wagmiConfig";
import { registerDomainTransaction, calculateRegistrationFee } from "@/lib/web3";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/components/wallet/WalletProvider";
import TransactionModal from "./TransactionModal";

interface RegisterDomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
  tld?: string;
  price?: string;
}

interface RegistrationPeriod {
  years: number;
  price: string;
}

// Parse domain name to get base name without TLD
const getBaseName = (domainName: string): string => {
  if (domainName.includes('.')) {
    return domainName.split('.')[0]; 
  }
  return domainName;
};

// Helper function to get current wallet status
const getWalletStatus = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return { isWalletConnected: false, walletAddress: null };
  }
  
  const isWalletConnected = !!window.ethereum.selectedAddress;
  const walletAddress = window.ethereum.selectedAddress;
  
  return { isWalletConnected, walletAddress };
};

const getRegistrationOptions = async (
  basePrice: string, 
  domainName: string, 
  tld: string
): Promise<RegistrationPeriod[]> => {
  const price = parseFloat(basePrice);
  
  try {
    // Try to get on-chain prices for different periods
    const name = getBaseName(domainName);
    
    const oneYearPrice = await calculateRegistrationFee(name, tld, 1);
    const twoYearPrice = await calculateRegistrationFee(name, tld, 2);
    const fiveYearPrice = await calculateRegistrationFee(name, tld, 5);
    const tenYearPrice = await calculateRegistrationFee(name, tld, 10);
    
    return [
      { years: 1, price: oneYearPrice },
      { years: 2, price: twoYearPrice },
      { years: 5, price: fiveYearPrice },
      { years: 10, price: tenYearPrice },
    ];
  } catch (error) {
    console.error("Error fetching on-chain prices:", error);
    
    // Fallback to calculated prices if on-chain prices aren't available
    return [
      { years: 1, price: basePrice },
      { years: 2, price: (price * 1.8).toFixed(4) }, // 10% discount for 2 years
      { years: 5, price: (price * 4).toFixed(4) },   // 20% discount for 5 years
      { years: 10, price: (price * 7).toFixed(4) },  // 30% discount for 10 years
    ];
  }
};

const RegisterDomainModal = ({ open, onOpenChange, domainName, tld = "eth", price = "0.05" }: RegisterDomainModalProps) => {
  const [registrationPeriod, setRegistrationPeriod] = useState<string>("1");
  const [agreed, setAgreed] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [registrationOptions, setRegistrationOptions] = useState<RegistrationPeriod[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [walletLocalState, setWalletLocalState] = useState<{
    isWalletConnected: boolean;
    walletAddress: string | null;
  }>({ isWalletConnected: false, walletAddress: null });
  
  // Get the wallet state from our provider
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Combined connection state - using both provider and our local check
  const isWalletConnected = isConnected || walletLocalState.isWalletConnected;
  const walletAddress = address || walletLocalState.walletAddress;

  // Get the selected option
  const selectedOption = registrationOptions.find(option => option.years === parseInt(registrationPeriod));

  // Check actual wallet connection state
  useEffect(() => {
    // Debug connection state
    console.log('Current wallet connection state:', { isConnected, address });
    
    // Use the real wallet state from Wagmi
    if (isConnected && address) {
      setWalletLocalState({
        isWalletConnected: true,
        walletAddress: address
      });
    } else {
      // Check if window.ethereum is available as a fallback
      const { isWalletConnected, walletAddress } = getWalletStatus();
      setWalletLocalState({
        isWalletConnected,
        walletAddress
      });
    }
  }, [isConnected, address]);

  // Load registration options when modal opens or domainName/tld changes
  useEffect(() => {
    if (open) {
      setIsLoadingPrices(true);
      
      const fetchPrices = async () => {
        const options = await getRegistrationOptions(price, domainName, tld);
        setRegistrationOptions(options);
        setIsLoadingPrices(false);
      };
      
      fetchPrices();
    }
  }, [open, domainName, tld, price]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const effectiveAddress = address || walletLocalState.walletAddress;
      if (!effectiveAddress || !selectedOption) {
        throw new Error("Wallet address or registration period not set");
      }
      
      // Parse domain name to get base name without TLD
      const name = getBaseName(domainName);
      
      try {
        console.log("Starting blockchain registration for:", name, tld, selectedOption.years);
        console.log("Using wallet address:", effectiveAddress);
        
        // Register the domain on the blockchain
        const result = await registerDomainTransaction(
          name,
          tld,
          selectedOption.years
        );
        
        console.log("Blockchain registration successful:", result);
        const { transactionHash, tokenId } = result;
        
        // Now register in our database
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + selectedOption.years);
        
        console.log("Registering in database:", {
          name,
          tld,
          owner: effectiveAddress,
          expires: expirationDate.toISOString(),
          tokenId
        });
        
        const response = await apiRequest("POST", "/api/domains/register", {
          name: name,
          tld: tld,
          owner: effectiveAddress,
          expires: expirationDate.toISOString(),
          price: selectedOption.price,
          transactionHash,
          tokenId,
          isActive: true,
        });
        
        return response.json();
      } catch (error: any) {
        console.error("Domain registration error:", error);
        
        // Check for user rejection
        if (error.message.includes('user rejected') || error.code === 4001) {
          throw new Error("Transaction was rejected. Please try again.");
        }
        
        // Check for network error
        if (error.message.includes('network') || error.message.includes('connection')) {
          throw new Error("Network error. Please check your connection and try again.");
        }
        
        // Pass the error up
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/domains/my'] });
      toast({
        title: "Domain registered",
        description: `${domainName} has been successfully registered on the blockchain.`,
      });
      setShowTransactionModal(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setShowTransactionModal(false);
    },
  });

  const handleProceedToPayment = () => {
    if (!agreed) {
      toast({
        title: "Agreement required",
        description: "Please agree to the terms before proceeding",
        variant: "destructive",
      });
      return;
    }

    // Check if wallet is connected before proceeding
    if (!isWalletConnected || (!address && !walletLocalState.walletAddress)) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet before registering a domain",
        variant: "destructive",
      });
      // Open Web3Modal to prompt wallet connection
      web3Modal.open();
      return;
    }
    
    setShowTransactionModal(true);
  };

  const handleConfirmTransaction = () => {
    registerMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="neumorphic p-8 max-w-md w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-montserrat font-bold text-2xl mb-2">Register Domain</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              {isWalletConnected 
                ? "Set up your registration details" 
                : "Connect your wallet to register this domain"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <label className="block text-foreground font-medium mb-2">Domain Name</label>
              <div className="flex items-center neumorphic-input rounded-xl px-4 py-3">
                <input 
                  type="text" 
                  value={domainName.includes('.') ? domainName.split('.')[0] : domainName} 
                  className="bg-transparent border-none focus:outline-none flex-grow" 
                  readOnly 
                />
                <span className="text-secondary font-medium">.{tld}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-foreground font-medium mb-2">Registration Period</label>
              <Select
                value={registrationPeriod}
                onValueChange={setRegistrationPeriod}
              >
                <SelectTrigger className="neumorphic-input w-full rounded-xl px-4 py-3 focus:outline-none">
                  <SelectValue placeholder="Select registration period" />
                </SelectTrigger>
                <SelectContent>
                  {registrationOptions.map((option) => (
                    <SelectItem key={option.years} value={option.years.toString()}>
                      {option.years} {option.years === 1 ? 'year' : 'years'} ({option.price} ETH)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="agreement" 
                checked={agreed} 
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <label
                htmlFor="agreement"
                className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand that domain registrations are final and non-refundable
              </label>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col space-y-3">
            {!isWalletConnected ? (
              <Button
                onClick={() => web3Modal.open()}
                className="bg-primary text-white font-medium py-3 px-6 rounded-xl transition hover:bg-primary/90 w-full"
              >
                Connect Wallet
              </Button>
            ) : (
              <Button
                onClick={handleProceedToPayment}
                className="bg-primary text-white font-medium py-3 px-6 rounded-xl transition hover:bg-primary/90 w-full"
                disabled={!agreed}
              >
                Proceed to Payment
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-600 font-medium py-2"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedOption && (
        <TransactionModal
          open={showTransactionModal}
          onOpenChange={setShowTransactionModal}
          domainName={domainName}
          registrationYears={selectedOption.years}
          price={selectedOption.price}
          networkFee="0.002"
          onConfirm={handleConfirmTransaction}
          isProcessing={registerMutation.isPending}
        />
      )}
    </>
  );
};

export default RegisterDomainModal;
