import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Check, X } from "lucide-react";
import RegisterDomainModal from "./RegisterDomainModal";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkDomainAvailability, calculateRegistrationFee } from "@/lib/web3";

interface TLD {
  tld: string;
  price: string;
  description: string;
}

const DomainSearch = () => {
  const [domainName, setDomainName] = useState("");
  const [searchedDomain, setSearchedDomain] = useState<string | null>(null);
  const [selectedTld, setSelectedTld] = useState("eth");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [onChainAvailability, setOnChainAvailability] = useState<boolean | null>(null);
  const [onChainPrice, setOnChainPrice] = useState<string | null>(null);
  const { isConnected } = useWallet();
  const { toast } = useToast();
  const [contractTlds, setContractTlds] = useState<string[]>([]);

  // Fetch TLDs from contract
  useEffect(() => {
    const fetchTlds = async () => {
      const { getAvailableTLDs } = await import('@/lib/web3');
      const tlds = await getAvailableTLDs();
      setContractTlds(tlds);
    };
    fetchTlds();
  }, []);

  interface DomainSearchResult {
    name: string;
    baseName?: string;
    tld?: string;
    available: boolean;
  }

  // Backend domain availability check
  const domainQuery = useQuery<DomainSearchResult>({
    queryKey: ['/api/domains/search', searchedDomain, selectedTld],
    enabled: !!searchedDomain,
    queryFn: async () => {
      const url = new URL('/api/domains/search', window.location.origin);
      url.searchParams.append('name', searchedDomain || '');
      url.searchParams.append('tld', selectedTld);
      const response = await fetch(url);
      const data = await response.json();
      
      // After getting backend results, also check on-chain
      if (searchedDomain) {
        try {
          console.log("Checking on-chain availability for:", searchedDomain, selectedTld);
          
          // Check domain availability on the blockchain
          const isAvailable = await checkDomainAvailability(searchedDomain, selectedTld);
          console.log("On-chain availability result:", isAvailable);
          setOnChainAvailability(isAvailable);
          
          // If available, calculate registration fee
          if (isAvailable) {
            console.log("Domain is available, calculating registration fee");
            const price = await calculateRegistrationFee(searchedDomain, selectedTld, 1);
            console.log("On-chain price:", price);
            setOnChainPrice(price);
          }
        } catch (error) {
          console.error("Error checking on-chain availability:", error);
          
          // Show toast with the error
          toast({
            title: "Blockchain check failed",
            description: "Using backend availability result instead. Connect your wallet for accurate checks.",
            variant: "destructive",
          });
          
          // Fallback to backend result for availability
          setOnChainAvailability(data.available);
        }
      }
      
      return data;
    }
  });

  const handleSearch = () => {
    if (!domainName.trim()) {
      toast({
        title: "Domain name required",
        description: "Please enter a domain name to search",
        variant: "destructive",
      });
      return;
    }
    
    // Reset on-chain data when starting a new search
    setOnChainAvailability(null);
    setOnChainPrice(null);
    
    setSearchedDomain(domainName.trim().toLowerCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openRegisterModal = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register domains",
        variant: "destructive",
      });
      return;
    }
    setRegisterModalOpen(true);
  };

  const handleTldChange = (value: string) => {
    setSelectedTld(value);
    if (searchedDomain) {
      // Reset on-chain data when changing TLD
      setOnChainAvailability(null);
      setOnChainPrice(null);
      
      // Re-search with the new TLD
      domainQuery.refetch();
    }
  };

  const domainResult = domainQuery.data;
  const isLoading = domainQuery.isLoading;

  // Determine domain availability, prioritizing blockchain data if available
  const isDomainAvailable = onChainAvailability !== null 
    ? onChainAvailability 
    : domainResult?.available || false;

  // Get the price for the selected TLD
  const getSelectedTldPrice = () => {
    // Use on-chain price if available, otherwise use default
    return onChainPrice || "0.05";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="neumorphic p-6 md:p-8">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow relative">
            <Input
              type="text"
              placeholder="Search for a domain..."
              className="neumorphic-input w-full px-5 py-6 rounded-xl text-lg focus:outline-none"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="w-32">
            <Select value={selectedTld} onValueChange={handleTldChange}>
              <SelectTrigger className="h-14">
                <SelectValue placeholder=".eth" />
              </SelectTrigger>
              <SelectContent>
                {contractTlds.map((tld) => (
                  <SelectItem key={tld} value={tld}>
                    .{tld}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSearch}
            className="neumorphic-button bg-primary text-white font-medium py-4 px-8 rounded-xl transition transform hover:scale-105 hover:shadow-lg h-14"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
            Search
          </Button>
        </div>
        
        {domainResult && (
          <div className="mt-6 text-left">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center space-x-3">
                <span className="text-xl font-medium">
                  {domainResult.baseName || domainResult.name.split('.')[0]}
                </span>
                <span className="text-xl font-medium text-secondary">
                  .{domainResult.tld || selectedTld}
                </span>
                {isDomainAvailable ? (
                  <span className="px-2 py-1 bg-success text-white text-xs rounded-full flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Available
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-destructive text-white text-xs rounded-full flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    Taken
                  </span>
                )}
                {onChainAvailability !== null && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center">
                    On-chain verified
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                {onChainPrice && (
                  <span className="text-sm font-medium text-gray-600 mb-2">
                    {onChainPrice} ETH
                  </span>
                )}
                {isDomainAvailable && (
                  <Button 
                    onClick={openRegisterModal}
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Register
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {searchedDomain && (
        <RegisterDomainModal
          open={registerModalOpen}
          onOpenChange={setRegisterModalOpen}
          domainName={`${searchedDomain}.${selectedTld}`}
          tld={selectedTld}
          price={getSelectedTldPrice()}
        />
      )}
    </div>
  );
};

export default DomainSearch;
