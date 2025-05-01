import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import DomainCard from "@/components/domain/DomainCard";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { Domain } from "@shared/schema";

// Define contract domain interface to match what's returned from the contract
interface ContractDomain {
  id: number;
  name: string;
  tld: string;
  owner: string;
  expires: number;
  isActive: boolean;
  registered: string;
  price?: string;
  transactionHash?: string;
  tokenId?: number;
}

const MyDomains = () => {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState("owned");

  // Add console functions
  async function logTokensOwned() {
    if (!address || !window.ethereum) {
      console.log("Wallet not connected");
      return;
    }

    try {
      const { getDomainRegistryContract } = await import('@/lib/web3');
      const contract = await getDomainRegistryContract();
      const balance = await contract.balanceOf(address);
      console.log("Total tokens owned:", balance.toString());
      
      // Log all tokens
      const totalBalance = Number(balance);
      for (let i = 0; i < totalBalance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        console.log(`Token ${i + 1}/${totalBalance}:`, tokenId.toString());
        const domain = await contract.getDomain(tokenId);
        console.log(`Domain details for token ${tokenId}:`, domain);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  // Add to window for console access
  if (typeof window !== 'undefined') {
    // Extend Window interface for TypeScript
    (window as any).logTokensOwned = logTokensOwned;
  }

  const { data: domains, isLoading, error } = useQuery({
    queryKey: ['domains', address],
    queryFn: async () => {
      if (!address) {
        console.error("No wallet address available");
        throw new Error("Wallet not connected");
      }

      try {
        console.log("Fetching domains for address:", address);
        
        // Import necessary functions for contract interaction
        const { getDomainRegistryContract, getEthersProvider } = await import('@/lib/web3');
        
        // Check if provider is available
        const provider = getEthersProvider();
        if (!provider) {
          console.error("No provider available");
          throw new Error("No Ethereum provider available");
        }
        
        // Log connection details
        console.log("Provider network:", await provider.getNetwork());
        
        // Get and log provider connection status
        try {
          const blockNumber = await provider.getBlockNumber();
          console.log("Current block number:", blockNumber);
        } catch (networkErr) {
          console.error("Provider network error:", networkErr);
        }
        
        // Get contract instance
        const contract = await getDomainRegistryContract();
        
        // Get number of domains owned by this address
        const balance = await contract.balanceOf(address);
        console.log("Balance of address", address, ":", balance.toString());
        
        const totalBalance = Number(balance);
        const domains: ContractDomain[] = [];

        // Since tokenOfOwnerByIndex is not available, we'll use a different approach
        try {
          console.log("Using getUserDomains to fetch domains");
          
          // Use the getUserDomains function from web3.ts
          const { getUserDomains } = await import('@/lib/web3');
          const userDomains = await getUserDomains(address);
          console.log("Fetched user domains:", userDomains);
          
          // Convert returned domains to our format
          if (userDomains && Array.isArray(userDomains)) {
            userDomains.forEach((domain, index) => {
              if (domain) {
                // Create contract domain object with necessary fields
                domains.push({
                  id: domain.id || index,
                  name: domain.name || "",
                  tld: domain.tld || "eth",
                  owner: address,
                  expires: domain.expires || Date.now() + 31536000000, // Default 1 year from now
                  isActive: domain.isActive !== undefined ? domain.isActive : true,
                  registered: domain.registered || new Date().toISOString(),
                  price: domain.price || "0.05",
                  transactionHash: domain.transactionHash || "",
                  tokenId: domain.tokenId || domain.id || index
                });
              }
            });
          }
        } catch (getUserDomainsError) {
          console.error("Error with getUserDomains:", getUserDomainsError);
          
          // Fallback: Try to get all domains and filter by owner
          try {
            console.log("Fallback: Checking if contract has getDomainsOfOwner function");
            
            // Some contracts may have a getDomainsOfOwner function
            if (contract.getDomainsOfOwner) {
              const ownerDomains = await contract.getDomainsOfOwner(address);
              console.log("Domains from getDomainsOfOwner:", ownerDomains);
              
              if (ownerDomains && Array.isArray(ownerDomains)) {
                ownerDomains.forEach((domain, index) => {
                  domains.push({
                    id: domain.id || index,
                    name: domain.name || "",
                    tld: domain.tld || "eth",
                    owner: address,
                    expires: domain.expires || Date.now() + 31536000000,
                    isActive: domain.isActive !== undefined ? domain.isActive : true,
                    registered: new Date().toISOString(),
                    price: "0.05",
                    transactionHash: "",
                    tokenId: domain.id || index
                  });
                });
              }
            } else {
              console.log("No alternative method available to fetch domains");
            }
          } catch (fallbackError) {
            console.error("Fallback method failed:", fallbackError);
          }
        }
        
        console.log("Found domains:", domains);
        return domains;
      } catch (err) {
        console.error("Error in query function:", err);
        
        // Provide more specific error messages
        if (err instanceof Error) {
          if (err.message.includes("resolver or addr is not configured")) {
            throw new Error("Network configuration issue. Please check your wallet is connected to the correct network.");
          }
          if (err.message.includes("underlying network changed")) {
            throw new Error("Network changed. Please refresh the page and try again.");
          }
        }
        
        throw err;
      }
    },
    enabled: isConnected && !!address,
    retry: 1, // Only retry once to avoid spamming on real errors
    retryDelay: 1000, // Wait 1 second between retries
  });

  console.log("Query state:", { isLoading, domains, error });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Please connect your wallet to view and manage your blockchain domains.
        </p>
      </div>
    );
  }

  return (
    <section className="mb-20">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-montserrat font-bold text-2xl">My Domains</h2>
        <Link href="/">
          <Button className="bg-primary text-white font-medium py-2 px-6 rounded-lg transition hover:bg-primary/90">
            Register New
          </Button>
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 mb-8">
          <TabsList className="flex space-x-8 bg-transparent p-0">
            <TabsTrigger
              value="owned"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary px-1 py-4 text-gray-500 font-medium bg-transparent"
            >
              Owned Domains
            </TabsTrigger>
            <TabsTrigger
              value="subdomains"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary px-1 py-4 text-gray-500 font-medium bg-transparent"
            >
              Subdomains
            </TabsTrigger>
            <TabsTrigger
              value="dns"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary px-1 py-4 text-gray-500 font-medium bg-transparent"
            >
              DNS Records
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="owned" className="mt-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Searching for your domains...</p>
              <p className="text-gray-400 text-sm mt-2">This may take a moment as we connect to the blockchain</p>
            </div>
          ) : error ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2 text-red-500">Error Loading Domains</h3>
              <p className="text-gray-500 mb-6">
                {error instanceof Error ? error.message : "There was an error loading your domains."}
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  className="bg-primary text-white"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Link href="/">
                  <Button variant="outline">Register New Domain</Button>
                </Link>
              </div>
            </div>
          ) : domains && domains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domains.map((domain: ContractDomain) => (
                <DomainCard key={domain.id} domain={domain as any} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Domains Found</h3>
              <p className="text-gray-500 mb-6">You don't own any domains yet. Register your first domain to get started.</p>
              <Link href="/">
                <Button className="bg-primary text-white">Register a Domain</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="subdomains" className="mt-0">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Manage Your Subdomains</h3>
            <p className="text-gray-500 mb-6">
              Select a domain from the "Owned Domains" tab and click on "Subdomains" to manage subdomains for that specific domain.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="dns" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Loading DNS records...</p>
            </div>
          ) : domains && domains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domains.map((domain: any) => (
                <Card key={domain.id} className="neumorphic p-6">
                  <CardContent className="p-0">
                    <h3 className="text-lg font-semibold mb-2">
                      {domain.name}.{domain.tld}
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setOpen(true);
                        }}
                      >
                        Add/Update DNS Record
                      </Button>
                      <div className="text-sm text-gray-500 mt-2">
                        Current DNS Record:
                        {domain.uri ? (
                          <pre className="mt-1 p-2 bg-gray-50 rounded-md overflow-auto">
                            {(() => {
                              try {
                                const parsed = JSON.parse(domain.uri);
                                return JSON.stringify(parsed, null, 2);
                              } catch (e) {
                                return domain.uri;
                              }
                            })()}
                          </pre>
                        ) : (
                          <p className="mt-1 italic">No DNS record set</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Domains Found</h3>
              <p className="text-gray-500 mb-6">Register a domain to manage DNS records.</p>
              <Link href="/">
                <Button className="bg-primary text-white">Register a Domain</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default MyDomains;