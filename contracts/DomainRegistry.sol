// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title DomainRegistry
 * @dev Contract for managing domain registrations and subdomains as NFTs
 */
contract DomainRegistry is ERC721URIStorage, Ownable {
    using Strings for uint256;

    // Domain metadata structure
    struct Domain {
        string name;     // Domain name without TLD
        string tld;      // Top level domain (e.g., "eth", "com")
        uint256 expires; // Expiration timestamp
        bool isActive;   // Domain active status
    }

    // Subdomain metadata structure
    struct Subdomain {
        string name;           // Full subdomain name (e.g., "blog.example.com")
        address owner;         // Subdomain owner (could be different from domain owner)
        uint256 parentTokenId; // Token ID of parent domain
        bool isActive;         // Subdomain active status
    }

    // Mapping from token ID to Domain
    mapping(uint256 => Domain) public domains;
    
    // Mapping from domain name+tld hash to token ID
    mapping(bytes32 => uint256) private domainNameToTokenId;
    
    // Mapping from token ID to its subdomains
    mapping(uint256 => mapping(bytes32 => Subdomain)) public subdomains;
    
    // Mapping from token ID to its subdomain list
    mapping(uint256 => bytes32[]) public subdomainList;
    
    // Base fee for domain registration in wei
    uint256 public baseFee = 0.01 ether;
    
    // Fee multipliers for different TLDs
    mapping(string => uint256) public tldFeeMultiplier;
    
    // Available TLDs
    string[] public availableTlds;
    
    // Prices for different domain name lengths
    mapping(uint256 => uint256) public lengthPriceMultiplier;
    
    // Token ID counter
    uint256 private tokenIdCounter = 1;
    
    // Events
    event DomainRegistered(uint256 indexed tokenId, string name, string tld, address owner);
    event DomainRenewed(uint256 indexed tokenId, uint256 newExpiry);
    event SubdomainCreated(uint256 indexed parentTokenId, string name, address owner);
    event SubdomainTransferred(uint256 indexed parentTokenId, string name, address newOwner);
    event SubdomainRemoved(uint256 indexed parentTokenId, string name);
    
    /**
     * @dev Initialize the contract with available TLDs and their fee multipliers
     */
    constructor() ERC721("BlockchainDNS", "BDNS") Ownable(msg.sender) {
        // Add available TLDs with fee multipliers (1 = 1x base fee)
        _addTld("eth", 100); // 1.00x base fee
        _addTld("com", 200); // 2.00x base fee
        _addTld("org", 160); // 1.60x base fee
        _addTld("io", 180);  // 1.80x base fee
        _addTld("app", 150); // 1.50x base fee
        _addTld("tech", 120); // 1.20x base fee
        
        // Set price multipliers based on name length
        lengthPriceMultiplier[1] = 2000; // 20.00x for 1 character
        lengthPriceMultiplier[2] = 1000; // 10.00x for 2 characters
        lengthPriceMultiplier[3] = 500;  // 5.00x for 3 characters
        lengthPriceMultiplier[4] = 200;  // 2.00x for 4 characters
        lengthPriceMultiplier[5] = 100;  // 1.00x for 5+ characters
    }
    
    /**
     * @dev Add a new TLD to the available list
     * @param tld The TLD to add (e.g., "eth")
     * @param feeMultiplier The fee multiplier for this TLD (100 = 1x base fee)
     */
    function _addTld(string memory tld, uint256 feeMultiplier) internal {
        tldFeeMultiplier[tld] = feeMultiplier;
        availableTlds.push(tld);
    }
    
    /**
     * @dev Add a new TLD to the available list (admin only)
     * @param tld The TLD to add (e.g., "eth")
     * @param feeMultiplier The fee multiplier for this TLD (100 = 1x base fee)
     */
    function addTld(string memory tld, uint256 feeMultiplier) external onlyOwner {
        _addTld(tld, feeMultiplier);
    }
    
    /**
     * @dev Get all available TLDs
     * @return Array of available TLDs
     */
    function getAvailableTlds() external view returns (string[] memory) {
        return availableTlds;
    }
    
    /**
     * @dev Calculate domain registration fee based on name length and TLD
     * @param name Domain name
     * @param tld TLD
     * @param years Registration period in years
     * @return Registration fee in wei
     */
    function calculateRegistrationFee(string memory name, string memory tld, uint256 years) public view returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(tldFeeMultiplier[tld] > 0, "TLD not supported");
        require(years > 0 && years <= 10, "Years must be between 1 and 10");
        
        // Calculate base price based on name length
        uint256 length = bytes(name).length;
        uint256 lengthMultiplier = length >= 5 ? lengthPriceMultiplier[5] : lengthPriceMultiplier[length];
        
        // Calculate total price: baseFee * lengthMultiplier * tldMultiplier * years
        // Apply discount for multi-year registrations
        uint256 yearDiscount = 100 - (years > 1 ? (years * 5) : 0); // 5% discount per year, max 45%
        yearDiscount = yearDiscount < 55 ? 55 : yearDiscount; // Cap discount at 45%
        
        uint256 price = baseFee * lengthMultiplier * tldFeeMultiplier[tld] * years * yearDiscount / 10000;
        return price;
    }
    
    /**
     * @dev Register a new domain
     * @param name Domain name without TLD
     * @param tld TLD (e.g., "eth", "com")
     * @param years Registration period in years
     * @return tokenId of the registered domain
     */
    function registerDomain(string memory name, string memory tld, uint256 years) external payable returns (uint256) {
        // Check if name and tld are valid
        require(bytes(name).length > 0, "Name cannot be empty");
        require(tldFeeMultiplier[tld] > 0, "TLD not supported");
        
        // Check if domain is available
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".", tld));
        require(domainNameToTokenId[nameHash] == 0, "Domain already registered");
        
        // Calculate fee
        uint256 fee = calculateRegistrationFee(name, tld, years);
        require(msg.value >= fee, "Insufficient payment");
        
        // Mint new domain as NFT
        uint256 tokenId = tokenIdCounter++;
        _mint(msg.sender, tokenId);
        
        // Set domain metadata
        domains[tokenId] = Domain({
            name: name,
            tld: tld,
            expires: block.timestamp + (years * 365 days),
            isActive: true
        });
        
        // Map name hash to token ID
        domainNameToTokenId[nameHash] = tokenId;
        
        // Set token URI
        string memory tokenURI = string(
            abi.encodePacked(
                '{"name":"', name, '.', tld, '",',
                '"description":"Blockchain DNS Domain NFT",',
                '"expires":"', Strings.toString(domains[tokenId].expires), '",',
                '"tld":"', tld, '"}'
            )
        );
        _setTokenURI(tokenId, tokenURI);
        
        // Refund excess payment
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
        
        emit DomainRegistered(tokenId, name, tld, msg.sender);
        return tokenId;
    }
    
    /**
     * @dev Get domain details by token ID
     * @param tokenId Token ID of the domain
     * @return Domain struct with details
     */
    function getDomain(uint256 tokenId) external view returns (Domain memory) {
        require(_exists(tokenId), "Domain does not exist");
        return domains[tokenId];
    }
    
    /**
     * @dev Get token ID by domain name and TLD
     * @param name Domain name
     * @param tld TLD
     * @return tokenId Token ID of the domain
     */
    function getTokenIdByDomain(string memory name, string memory tld) external view returns (uint256) {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".", tld));
        uint256 tokenId = domainNameToTokenId[nameHash];
        require(tokenId != 0, "Domain not registered");
        return tokenId;
    }
    
    /**
     * @dev Check if domain is available
     * @param name Domain name
     * @param tld TLD
     * @return bool True if available
     */
    function isDomainAvailable(string memory name, string memory tld) external view returns (bool) {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".", tld));
        return domainNameToTokenId[nameHash] == 0;
    }
    
    /**
     * @dev Create a subdomain for a domain owned by msg.sender
     * @param parentTokenId Token ID of the parent domain
     * @param subdomainName Subdomain name (without parent domain)
     * @param owner Owner of the subdomain
     */
    function createSubdomain(uint256 parentTokenId, string memory subdomainName, address owner) external {
        require(_exists(parentTokenId), "Parent domain does not exist");
        require(ownerOf(parentTokenId) == msg.sender, "Not the domain owner");
        require(bytes(subdomainName).length > 0, "Subdomain name cannot be empty");
        
        Domain memory domain = domains[parentTokenId];
        require(domain.isActive, "Domain is not active");
        require(block.timestamp < domain.expires, "Domain expired");
        
        // Create full subdomain name
        string memory fullSubdomain = string(abi.encodePacked(subdomainName, ".", domain.name, ".", domain.tld));
        bytes32 subdomainHash = keccak256(abi.encodePacked(fullSubdomain));
        
        // Check if subdomain already exists
        require(subdomains[parentTokenId][subdomainHash].owner == address(0), "Subdomain already exists");
        
        // Create subdomain
        subdomains[parentTokenId][subdomainHash] = Subdomain({
            name: fullSubdomain,
            owner: owner,
            parentTokenId: parentTokenId,
            isActive: true
        });
        
        // Add to subdomain list
        subdomainList[parentTokenId].push(subdomainHash);
        
        emit SubdomainCreated(parentTokenId, fullSubdomain, owner);
    }
    
    /**
     * @dev Get all subdomains of a domain
     * @param tokenId Token ID of the domain
     * @return Array of subdomain structs
     */
    function getSubdomains(uint256 tokenId) external view returns (Subdomain[] memory) {
        require(_exists(tokenId), "Domain does not exist");
        
        bytes32[] memory hashes = subdomainList[tokenId];
        Subdomain[] memory result = new Subdomain[](hashes.length);
        
        for (uint256 i = 0; i < hashes.length; i++) {
            result[i] = subdomains[tokenId][hashes[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Transfer ownership of a subdomain
     * @param parentTokenId Token ID of the parent domain
     * @param subdomainName Full subdomain name
     * @param newOwner New owner address
     */
    function transferSubdomain(uint256 parentTokenId, string memory subdomainName, address newOwner) external {
        require(_exists(parentTokenId), "Parent domain does not exist");
        require(ownerOf(parentTokenId) == msg.sender, "Not the domain owner");
        
        bytes32 subdomainHash = keccak256(abi.encodePacked(subdomainName));
        Subdomain storage subdomain = subdomains[parentTokenId][subdomainHash];
        
        require(subdomain.owner != address(0), "Subdomain does not exist");
        require(subdomain.isActive, "Subdomain is not active");
        
        subdomain.owner = newOwner;
        
        emit SubdomainTransferred(parentTokenId, subdomainName, newOwner);
    }
    
    /**
     * @dev Deactivate a subdomain
     * @param parentTokenId Token ID of the parent domain
     * @param subdomainName Full subdomain name
     */
    function deactivateSubdomain(uint256 parentTokenId, string memory subdomainName) external {
        require(_exists(parentTokenId), "Parent domain does not exist");
        require(ownerOf(parentTokenId) == msg.sender, "Not the domain owner");
        
        bytes32 subdomainHash = keccak256(abi.encodePacked(subdomainName));
        Subdomain storage subdomain = subdomains[parentTokenId][subdomainHash];
        
        require(subdomain.owner != address(0), "Subdomain does not exist");
        require(subdomain.isActive, "Subdomain already inactive");
        
        subdomain.isActive = false;
        
        emit SubdomainRemoved(parentTokenId, subdomainName);
    }
    
    /**
     * @dev Renew a domain registration
     * @param tokenId Token ID of the domain
     * @param years Number of years to renew
     */
    function renewDomain(uint256 tokenId, uint256 years) external payable {
        require(_exists(tokenId), "Domain does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the domain owner");
        require(years > 0 && years <= 10, "Years must be between 1 and 10");
        
        Domain storage domain = domains[tokenId];
        require(domain.isActive, "Domain is not active");
        
        // Calculate renewal fee
        uint256 fee = calculateRegistrationFee(domain.name, domain.tld, years);
        require(msg.value >= fee, "Insufficient payment");
        
        // Update expiry
        domain.expires += years * 365 days;
        
        // Refund excess payment
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
        
        emit DomainRenewed(tokenId, domain.expires);
    }
    
    /**
     * @dev Update base fee (admin only)
     * @param newBaseFee New base fee in wei
     */
    function updateBaseFee(uint256 newBaseFee) external onlyOwner {
        baseFee = newBaseFee;
    }
    
    /**
     * @dev Update fee multiplier for a TLD (admin only)
     * @param tld TLD to update
     * @param newMultiplier New fee multiplier
     */
    function updateTldFeeMultiplier(string memory tld, uint256 newMultiplier) external onlyOwner {
        require(tldFeeMultiplier[tld] > 0, "TLD not supported");
        tldFeeMultiplier[tld] = newMultiplier;
    }
    
    /**
     * @dev Withdraw contract balance (admin only)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Override transferFrom to check domain expiry
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        // Ensure domain is active and not expired if being transferred
        Domain storage domain = domains[tokenId];
        if (domain.expires > 0) { // Ignore transfers during minting process
            require(domain.isActive, "Domain is not active");
            require(block.timestamp < domain.expires, "Domain expired");
        }
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Check if a token exists
     * @param tokenId Token ID to check
     * @return bool True if the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < tokenIdCounter && tokenId > 0;
    }
}