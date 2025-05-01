import { ethers } from "ethers";
import { getContractAddress, CONTRACT_ABIS } from "./contractConfig";
import { getNetworkByChainId } from "./networks";

// Define the window.ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Sepolia Chain ID in hex
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // Chain ID in hex for Sepolia

/**
 * Connects to MetaMask wallet
 * @returns Wallet address
 */
export async function connectMetaMask(): Promise<string> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install MetaMask to continue.",
    );
  }

  try {
    // Check if we're on Sepolia and switch networks if needed
    await switchToSepoliaNetwork();

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error(
        "No accounts found. Please check your MetaMask configuration.",
      );
    }

    // We're only interested in the first account for now
    const address = accounts[0];
    return address;
  } catch (error: any) {
    if (error.code === 4001) {
      // User rejected the request
      throw new Error("Please connect to MetaMask to use this feature.");
    } else {
      throw new Error(`Failed to connect to MetaMask: ${error.message}`);
    }
  }
}

/**
 * Switches to the specified network
 * @param networkKey The key of the network in SUPPORTED_NETWORKS to switch to
 */
export async function switchToNetwork(networkKey: string): Promise<void> {
  if (!window.ethereum) return;

  // Import from networks.ts to avoid circular dependency
  const { switchNetwork } = await import(
    "../components/wallet/NetworkSelector"
  );

  try {
    const success = await switchNetwork(networkKey);
    if (!success) {
      throw new Error(`Failed to switch to ${networkKey} network`);
    }
  } catch (error: any) {
    console.error(`Error switching to ${networkKey} network:`, error);
    throw new Error(
      `Failed to switch to ${networkKey} network: ${error.message}`,
    );
  }
}

/**
 * Switches the MetaMask network to Sepolia Testnet (legacy method)
 * @deprecated Use switchToNetwork('sepolia') instead
 */
export async function switchToSepoliaNetwork(): Promise<void> {
  return switchToNetwork("sepolia");
}

/**
 * Shortens an Ethereum address for display
 * @param address The full Ethereum address
 * @returns Shortened address
 */
export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Gets the Ethers provider for the current browser wallet
 * @returns Ethers BrowserProvider instance or null
 */
export function getEthersProvider(): ethers.BrowserProvider | null {
  if (!window.ethereum) {
    return null;
  }

  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Gets the DomainRegistry contract instance
 * @returns Contract instance
 */
export async function getDomainRegistryContract(): Promise<ethers.Contract> {
  const provider = getEthersProvider();
  if (!provider) {
    throw new Error("Ethereum provider not available");
  }

  // Get the current chain ID and map to our network key
  const { chainId } = await provider.getNetwork();
  const chainIdHex = "0x" + chainId.toString(16);
  const networkKey = getNetworkByChainId(chainIdHex) || "sepolia"; // Default to Sepolia

  // Get the contract address for the current network
  const contractAddress = getContractAddress(networkKey);

  // If no contract is deployed on this network, throw an error
  if (!contractAddress) {
    throw new Error(`No contract deployed on network: ${networkKey}`);
  }

  const signer = await provider.getSigner();
  return new ethers.Contract(
    contractAddress,
    CONTRACT_ABIS.DomainRegistry,
    signer,
  );
}

/**
 * Gets the current block number
 * @returns Current block number
 */
export async function getBlockNumber(): Promise<number> {
  const provider = getEthersProvider();
  if (!provider) {
    throw new Error("Ethereum provider not available");
  }

  return await provider.getBlockNumber();
}

/**
 * Checks if a domain is available
 * @param name Domain name without TLD
 * @param tld TLD (e.g., "eth", "com")
 * @returns True if domain is available
 */
export async function checkDomainAvailability(
  name: string,
  tld: string,
): Promise<boolean> {
  try {
    // Get the current network's key
    const provider = getEthersProvider();
    if (!provider) {
      // If no provider, use mock behavior
      await new Promise((resolve) => setTimeout(resolve, 500));
      const unavailableList = ["test", "admin", "blockchain", "web3", "crypto"];
      return !unavailableList.includes(name.toLowerCase());
    }

    const { chainId } = await provider.getNetwork();
    const chainIdHex = "0x" + chainId.toString(16);
    const networkKey = getNetworkByChainId(chainIdHex) || "sepolia";

    // Check if contract is deployed on this network
    const contractAddress = getContractAddress(networkKey);
    if (!contractAddress) {
      // No contract on this network, use mock behavior
      await new Promise((resolve) => setTimeout(resolve, 500));
      const unavailableList = ["test", "admin", "blockchain", "web3", "crypto"];
      return !unavailableList.includes(name.toLowerCase());
    }

    // Use contract to check availability
    const contract = await getDomainRegistryContract();
    return await contract.isDomainAvailable(name, tld);
  } catch (error) {
    console.error("Error checking domain availability:", error);
    // Default to available in case of errors for better UX
    return true;
  }
}

/**
 * Calculates the registration fee for a domain
 * @param name Domain name without TLD
 * @param tld TLD (e.g., "eth", "com")
 * @param years Registration period in years
 * @returns Registration fee in ETH as a string
 */
export async function calculateRegistrationFee(
  name: string,
  tld: string,
  years: number,
): Promise<string> {
  try {
    // Get the current network's key
    const provider = getEthersProvider();
    if (!provider) {
      // If no provider, use mock behavior
      // Basic price logic for mocked fee calculation
      const baseFee = 0.01; // ETH
      const tldMultipliers: { [key: string]: number } = {
        eth: 1.0,
        com: 2.0,
        org: 1.6,
        io: 1.8,
        app: 1.5,
        tech: 1.2,
      };
      const lengthMultiplier = name.length <= 4 ? 5 - name.length : 1;

      const tldMultiplier = tldMultipliers[tld] || 1.0;
      const yearDiscount = years > 1 ? Math.min(years * 0.05, 0.45) : 0;

      const price =
        baseFee * lengthMultiplier * tldMultiplier * years * (1 - yearDiscount);

      return price.toFixed(4);
    }

    const { chainId } = await provider.getNetwork();
    const chainIdHex = "0x" + chainId.toString(16);
    const networkKey = getNetworkByChainId(chainIdHex) || "sepolia";

    // Check if contract is deployed on this network
    const contractAddress = getContractAddress(networkKey);
    if (!contractAddress) {
      // No contract on this network, use mock behavior
      const baseFee = 0.01; // ETH
      const tldMultipliers: { [key: string]: number } = {
        eth: 1.0,
        com: 2.0,
        org: 1.6,
        io: 1.8,
        app: 1.5,
        tech: 1.2,
      };
      const lengthMultiplier = name.length <= 4 ? 5 - name.length : 1;

      const tldMultiplier = tldMultipliers[tld] || 1.0;
      const yearDiscount = years > 1 ? Math.min(years * 0.05, 0.45) : 0;

      const price =
        baseFee * lengthMultiplier * tldMultiplier * years * (1 - yearDiscount);

      return price.toFixed(4);
    }

    const contract = await getDomainRegistryContract();
    const fee = await contract.calculateRegistrationFee(name, tld, years);

    // Convert fee from wei to ETH
    return ethers.formatEther(fee);
  } catch (error) {
    console.error("Error calculating registration fee:", error);
    // Return a default price to prevent UI errors
    return "0.05";
  }
}

/**
 * Registers a domain on the blockchain
 * @param name Domain name without TLD
 * @param tld TLD (e.g., "eth", "com")
 * @param years Registration period in years
 * @returns Transaction details including hash and token ID
 */
export async function registerDomainTransaction(
  name: string,
  tld: string,
  years: number,
): Promise<{ transactionHash: string; tokenId: number }> {
  try {
    // Get the current network's key
    const provider = getEthersProvider();
    if (!provider) {
      // If no provider, use mock behavior
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate a random transaction hash
      const transactionHash =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");

      // Generate a random token ID
      const tokenId = Math.floor(1000 + Math.random() * 9000);

      return {
        transactionHash,
        tokenId,
      };
    }

    const { chainId } = await provider.getNetwork();
    const chainIdHex = "0x" + chainId.toString(16);
    const networkKey = getNetworkByChainId(chainIdHex) || "sepolia";

    // Check if contract is deployed on this network
    const contractAddress = getContractAddress(networkKey);
    if (!contractAddress) {
      // No contract on this network, use mock behavior
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate a random transaction hash
      const transactionHash =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");

      // Generate a random token ID
      const tokenId = Math.floor(1000 + Math.random() * 9000);

      return {
        transactionHash,
        tokenId,
      };
    }

    // Get contract instance
    const contract = await getDomainRegistryContract();

    console.log(
      `Calculating registration fee for ${name}.${tld} for ${years} years`,
    );

    // Calculate fee
    const fee = await contract.calculateRegistrationFee(name, tld, years);

    console.log("Raw fee from contract:", fee);
    console.log("Fee type:", typeof fee);

    // Log the fee value as received from the contract
    console.log("Fee as received from contract:", fee);

    // Add some metadata for first-time registration (random data)
    // This will be used for any token-specific properties
    console.log("Generating random metadata for domain registration");
    const metadata = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Register domain with the calculated fee
    // Handle the fee format correctly
    console.log("Preparing fee for transaction:", fee);
    console.log("Fee type:", typeof fee);


    // Create metadata for the domain registration
    const metadata2 = "blockDNS registration";
    // Call contract with all required parameters
    const tx = await contract.registerDomain(name, tld, years, metadata2, {
      value: fee
    });

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Find the DomainRegistered event
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === "DomainRegistered",
    );

    let tokenId: number = 0;

    if (event && event.args) {
      // Extract token ID from the event - handle both BigInt and number
      const rawTokenId = event.args[0];
      tokenId = typeof rawTokenId === 'bigint' ? Number(rawTokenId) : 
                typeof rawTokenId?.toNumber === 'function' ? rawTokenId.toNumber() :
                Number(rawTokenId);
    }

    return {
      transactionHash: tx.hash,
      tokenId,
    };
  } catch (error: any) {
    console.error("Error registering domain:", error);
    throw new Error(`Failed to register domain: ${error.message}`);
  }
}

/**
 * Creates a subdomain for a domain
 * @param domainTokenId Parent domain token ID
 * @param subdomain Subdomain name (without parent domain)
 * @param owner Owner address for the subdomain
 * @returns Transaction hash
 */
export async function createSubdomain(
  domainTokenId: number,
  subdomain: string,
  owner: string,
): Promise<string> {
  try {
    // Get the current network's key
    const provider = getEthersProvider();
    if (!provider) {
      // If no provider, use mock behavior
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate a random transaction hash
      const transactionHash =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");

      return transactionHash;
    }

    const { chainId } = await provider.getNetwork();
    const chainIdHex = "0x" + chainId.toString(16);
    const networkKey = getNetworkByChainId(chainIdHex) || "sepolia";

    // Check if contract is deployed on this network
    const contractAddress = getContractAddress(networkKey);
    if (!contractAddress) {
      // No contract on this network, use mock behavior
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate a random transaction hash
      const transactionHash =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");

      return transactionHash;
    }

    // Get contract instance
    const contract = await getDomainRegistryContract();

    // Create subdomain with metadata
    const metadata = JSON.stringify({
      owner,
      createdAt: new Date().toISOString(),
    });

    // Create subdomain
    const tx = await contract.createSubdomain(
      domainTokenId,
      subdomain,
      metadata,
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    return tx.hash;
  } catch (error: any) {
    console.error("Error creating subdomain:", error);
    throw new Error(`Failed to create subdomain: ${error.message}`);
  }
}

/**
 * Gets all subdomains for a domain
 * @param domainTokenId Parent domain token ID
 * @returns Array of subdomain objects
 */
export async function getSubdomains(domainTokenId: number): Promise<any[]> {
  try {
    // Get the current network's key
    const provider = getEthersProvider();
    if (!provider) {
      // If no provider, use mock behavior
      return [];
    }

    const { chainId } = await provider.getNetwork();
    const chainIdHex = "0x" + chainId.toString(16);
    const networkKey = getNetworkByChainId(chainIdHex) || "sepolia";

    // Check if contract is deployed on this network
    const contractAddress = getContractAddress(networkKey);
    if (!contractAddress) {
      // No contract on this network, use mock behavior
      return [];
    }

    // Get contract instance
    const contract = await getDomainRegistryContract();

    // Get subdomains
    const subdomains = await contract.getSubdomains(domainTokenId);

    return subdomains.map((sub: any) => ({
      name: sub.name,
      metadata: sub.metadata,
      parentTokenId: sub.parentTokenId.toNumber(),
      isActive: sub.isActive,
    }));
  } catch (error) {
    console.error("Error getting subdomains:", error);
    return [];
  }
}

/**
 * Listen for account changes
 * @param callback Function to call when accounts change
 */
export function setupAccountChangeListener(
  callback: (accounts: string[]) => void,
): void {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", callback);
  }
}

/**
 * Listen for chain changes
 * @param callback Function to call when chain changes
 */
export function setupChainChangeListener(callback: () => void): void {
  if (window.ethereum) {
    window.ethereum.on("chainChanged", callback);
  }
}

export async function getAvailableTLDs(): Promise<string[]> {
  try {
    const contract = await getDomainRegistryContract();
    const tlds = await contract.getAvailableTlds();
    console.log("Available TLDs from contract:", tlds);
    return tlds;
  } catch (error) {
    console.error("Error getting available TLDs:", error);
    return [];
  }
}

export async function testRegistrationFees() {
  try {
    const contract = await getDomainRegistryContract();
    const tlds = await contract.getAvailableTlds();
    const randomName = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit number

    console.log(`Testing registration fees for name: ${randomName}`);
    console.log('----------------------------------------');

    for (const tld of tlds) {
      const fee = await contract.calculateRegistrationFee(randomName, tld, 1);
      console.log(`${randomName}.${tld}: ${ethers.formatEther(fee)} ETH`);
    }
  } catch (error) {
    console.error("Error testing registration fees:", error);
  }
}

// Call the test function
testRegistrationFees();

/**
 * Gets the token URI for a domain
 * @param name Domain name without TLD
 * @param tld TLD (e.g., "eth", "com")
 * @returns Token URI string
 */
export async function getTokenURIByDomain(name: string, tld: string): Promise<string> {
  try {
    const contract = await getDomainRegistryContract();
    const uri = await contract.getTokenURIByDomain(name, tld);
    return uri;
  } catch (error) {
    console.error("Error getting token URI:", error);
    throw error;
  }
}

// Make functions available globally
declare global {
  interface Window {
    addNewTld: (tld: string, feeMultiplier: number) => Promise<void>;
    updateTldFeeMultiplier: (tld: string, newMultiplier: number) => Promise<void>;
    getUserDomains: (address: string) => Promise<any[]>;
    getTokenURIByDomain: (name: string, tld: string) => Promise<string>;
  }
}

// Expose functions to window object
if (typeof window !== 'undefined') {
  window.addNewTld = addNewTld;
  window.updateTldFeeMultiplier = updateTldFeeMultiplier;
  window.getUserDomains = getUserDomains;
  window.getTokenURIByDomain = getTokenURIByDomain;
}

export async function addNewTld(tld: string, feeMultiplier: number): Promise<void> {
  try {
    const contract = await getDomainRegistryContract();
    const tx = await contract.addTld(tld, feeMultiplier);
    await tx.wait();
    console.log(`Added new TLD: ${tld} with fee multiplier: ${feeMultiplier}`);
  } catch (error: any) {
    console.error("Error adding new TLD:", error);
    if (error.message.includes("Ownable: caller is not the owner")) {
      throw new Error("Only contract owner can add new TLDs");
    }
    throw error;
  }
}

export async function updateTldFeeMultiplier(tld: string, newMultiplier: number): Promise<void> {
  try {
    const contract = await getDomainRegistryContract();
    const tx = await contract.updateTldFeeMultiplier(tld, newMultiplier);
    await tx.wait();
    console.log(`Updated fee multiplier for ${tld} to: ${newMultiplier}`);
  } catch (error: any) {
    console.error("Error updating TLD fee multiplier:", error);
    if (error.message.includes("Ownable: caller is not the owner")) {
      throw new Error("Only contract owner can update TLD fee multipliers");
    }
    throw error;
  }
}

export async function getUserDomains(address: string): Promise<any[]> {
  try {
    console.log("Getting domains for address:", address);
    const contract = await getDomainRegistryContract();
    const provider = getEthersProvider();
    
    if (!provider) {
      console.error("No Ethereum provider available");
      return [];
    }
    
    // Get total token balance from balanceOf
    try {
      // Check if the required functions are available
      const hasDomainFunctions = typeof contract.balanceOf === 'function' && 
                                typeof contract.getDomain === 'function';
      
      if (!hasDomainFunctions) {
        console.error("Contract is missing required functions balanceOf or getDomain");
        return [];
      }
      
      // Get balance
      console.log("Getting balance for address:", address);
      const balance = await contract.balanceOf(address);
      const totalBalance = Number(balance);
      console.log(`User owns ${totalBalance} domains according to balanceOf`);
      
      if (totalBalance === 0) {
        console.log("User has no domains according to balanceOf");
        return [];
      }
      
      // The contract has balanceOf but no tokenOfOwnerByIndex, 
      // so we can't easily get the tokenIds for the owner.
      // Instead, we'll scan recent token IDs and check if they belong to the user
      
      console.log("No tokenOfOwnerByIndex available, scanning recent tokens");
      const domains = [];
      
      // Try a reasonable range of token IDs
      const maxTokensToCheck = 100; // Limit our search to avoid too many requests
      const latestBlock = await provider.getBlockNumber();
      
      console.log(`Scanning up to ${maxTokensToCheck} recent tokens, current block: ${latestBlock}`);
      
      // Method 1: Try to get recently registered domains
      try {
        // First try using getRegisteredDomains if available
        if (typeof contract.getRegisteredDomains === 'function') {
          console.log("Using getRegisteredDomains method");
          const allDomains = await contract.getRegisteredDomains();
          
          if (allDomains && Array.isArray(allDomains)) {
            console.log(`Found ${allDomains.length} registered domains`);
            
            // Filter domains by owner
            for (const domainData of allDomains) {
              if (domainData.owner && 
                  domainData.owner.toLowerCase() === address.toLowerCase()) {
                console.log(`Found owned domain:`, domainData);
                domains.push({
                  id: domainData.id || domainData.tokenId || domains.length + 1,
                  name: domainData.name,
                  tld: domainData.tld,
                  owner: address,
                  expires: Number(domainData.expires || 0),
                  isActive: !!domainData.isActive,
                  registered: domainData.registered || new Date().toISOString(),
                  price: domainData.price || "0.05",
                  transactionHash: domainData.transactionHash || ""
                });
              }
            }
            
            if (domains.length > 0) {
              console.log(`Found ${domains.length} domains for user`);
              return domains;
            }
          }
        }
      } catch (method1Error) {
        console.error("Error using getRegisteredDomains:", method1Error);
      }
      
      // Method 2: Try to use DomainRegistered events
      try {
        console.log("Using DomainRegistered events to find domains");
        
        const contractAddress = contract.target || contract.address;
        console.log("Contract address:", contractAddress);
        
        // Look for DomainRegistered events
        const filter = {
          address: contractAddress,
          fromBlock: Math.max(0, latestBlock - 10000), // Look back 10,000 blocks or to genesis
          toBlock: "latest"
        };
        
        console.log("Applying filter:", filter);
        
        const events = await provider.getLogs(filter);
        console.log(`Found ${events.length} events, filtering for owned domains`);
        
        // Process the events 
        for (const event of events) {
          try {
            // If we can parse this event
            if (event.topics && event.topics.length > 2) {
              // Try to decode the event - topic[0] is event signature, topic[2] might be the address
              const addressFromTopic = event.topics[2];
              
              if (addressFromTopic) {
                // Check if this event is for our address
                const paddedAddress = ethers.zeroPadValue(address.toLowerCase(), 32).toLowerCase();
                
                if (addressFromTopic.toLowerCase() === paddedAddress) {
                  console.log(`Found event for address: ${address}`);
                  
                  // Try to get the token ID from the event
                  let tokenId;
                  try {
                    // Sometimes tokenId is in the first topic after the signature
                    tokenId = Number(BigInt(event.topics[1]));
                  } catch (e) {
                    // If we can't parse it directly, try random IDs close to the event block
                    tokenId = event.blockNumber;
                  }
                  
                  // Try to get the domain details
                  if (tokenId) {
                    try {
                      console.log(`Checking domain for token ID: ${tokenId}`);
                      const domain = await contract.getDomain(tokenId);
                      
                      if (domain && domain.owner && 
                          domain.owner.toLowerCase() === address.toLowerCase()) {
                        console.log(`Found domain for token ${tokenId}:`, domain);
                        
                        domains.push({
                          id: tokenId,
                          name: domain.name,
                          tld: domain.tld,
                          owner: address,
                          expires: Number(domain.expires || 0),
                          isActive: !!domain.isActive,
                          registered: new Date().toISOString(),
                          price: "0.05", // Default price
                          transactionHash: event.transactionHash || ""
                        });
                      }
                    } catch (domainError) {
                      console.log(`Error getting domain for token ${tokenId}:`, domainError);
                    }
                  }
                }
              }
            }
          } catch (eventError) {
            console.error("Error processing event:", eventError);
          }
        }
        
        if (domains.length > 0) {
          console.log(`Found ${domains.length} domains from events`);
          return domains;
        }
      } catch (method2Error) {
        console.error("Error using events method:", method2Error);
      }
      
      // Method 3: Brute force check a range of IDs
      console.log("Using brute force method to scan for domains");
      
      // Since we know the user owns totalBalance domains, we can try recent token IDs
      // We'll check a reasonable number of recent token IDs
      let foundCount = 0;
      const maxAttempts = Math.max(100, totalBalance * 10); // Check at least 10x the balance count
      
      for (let attempt = 0; attempt < maxAttempts && foundCount < totalBalance; attempt++) {
        // Start with small token IDs and increase
        const tokenId = attempt + 1;
        
        try {
          // Check if this token exists and who owns it
          console.log(`Checking owner of token ${tokenId}`);
          
          // See if we can get the owner
          let owner;
          try {
            if (typeof contract.ownerOf === 'function') {
              owner = await contract.ownerOf(tokenId);
            } else {
              // Try to get the domain and check its owner
              const domain = await contract.getDomain(tokenId);
              owner = domain?.owner;
            }
          } catch (e) {
            // Token might not exist, skip to next
            continue;
          }
          
          // If we found a token owned by this address
          if (owner && owner.toLowerCase() === address.toLowerCase()) {
            console.log(`Found token ${tokenId} owned by ${address}`);
            foundCount++;
            
            // Get domain details
            const domain = await contract.getDomain(tokenId);
            
            if (domain) {
              // Get the domain URI
              let uri = "";
              try {
                uri = await contract.getTokenURIByDomain(domain.name, domain.tld);
              } catch (error) {
                console.error("Error fetching URI:", error);
              }

              domains.push({
                id: tokenId,
                name: domain.name || `domain-${tokenId}`,
                tld: domain.tld || "eth",
                owner: address,
                expires: Number(domain.expires || 0),
                isActive: !!domain.isActive,
                registered: new Date().toISOString(),
                price: "0.05",
                transactionHash: "",
                uri: uri
              });
            }
          }
        } catch (tokenError) {
          // Ignore errors for tokens that don't exist or other issues
        }
      }
      
      if (domains.length > 0) {
        console.log(`Found ${domains.length} domains using brute force method`);
        return domains;
      }
      
      console.log("Could not find any domains for this address, despite positive balance");
      return [];
    } catch (balanceError) {
      console.error("Error checking domain balance:", balanceError);
      return [];
    }
  } catch (error) {
    console.error("Error getting user domains:", error);
    return [];
  }
}