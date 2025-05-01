import { 
  users, 
  domains, 
  subdomains, 
  type User, 
  type InsertUser, 
  type Domain, 
  type InsertDomain, 
  type Subdomain, 
  type InsertSubdomain 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Domain methods
  getDomain(id: number): Promise<Domain | undefined>;
  getDomainByName(name: string): Promise<Domain | undefined>;
  getDomainsByOwner(owner: string): Promise<Domain[]>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, updates: Partial<InsertDomain>): Promise<Domain | undefined>;
  
  // Subdomain methods
  getSubdomain(id: number): Promise<Subdomain | undefined>;
  getSubdomainsByDomainId(domainId: number): Promise<Subdomain[]>;
  createSubdomain(subdomain: InsertSubdomain): Promise<Subdomain>;
  updateSubdomain(id: number, updates: Partial<InsertSubdomain>): Promise<Subdomain | undefined>;
  deleteSubdomain(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private domains: Map<number, Domain>;
  private subdomains: Map<number, Subdomain>;
  
  private userIdCounter: number;
  private domainIdCounter: number;
  private subdomainIdCounter: number;

  constructor() {
    this.users = new Map();
    this.domains = new Map();
    this.subdomains = new Map();
    
    this.userIdCounter = 1;
    this.domainIdCounter = 1;
    this.subdomainIdCounter = 1;
    
    // Add some predefined domains for testing
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    this.domains.set(1, {
      id: 1,
      name: "cryptoduck",
      tld: "eth",
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      registered: new Date(2023, 4, 12), // May 12, 2023
      expires: oneYearFromNow,
      price: "0.05",
      transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      tokenId: 1001,
      isActive: true
    });
    
    this.domains.set(2, {
      id: 2,
      name: "web3builder",
      tld: "eth",
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      registered: new Date(2023, 1, 18), // Feb 18, 2023
      expires: oneYearFromNow,
      price: "0.05",
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      tokenId: 1002,
      isActive: true
    });
    
    this.domains.set(3, {
      id: 3,
      name: "blockchain",
      tld: "com",
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      registered: new Date(2023, 3, 15), // April 15, 2023
      expires: oneYearFromNow,
      price: "0.1",
      transactionHash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
      tokenId: 1003,
      isActive: true
    });
    
    this.domains.set(4, {
      id: 4,
      name: "decentral",
      tld: "org",
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      registered: new Date(2023, 5, 20), // June 20, 2023
      expires: oneYearFromNow,
      price: "0.08",
      transactionHash: "0x1a2b3c4d5e6f7890123456789abcdef1a2b3c4d5e6f7890123456789abcdef12",
      tokenId: 1004,
      isActive: true
    });
    
    this.subdomains.set(1, {
      id: 1,
      name: "blog.cryptoduck",
      parentDomainId: 1,
      created: new Date(2023, 5, 12), // June 12, 2023
      records: 3,
      isActive: true
    });
    
    this.subdomains.set(2, {
      id: 2,
      name: "app.cryptoduck",
      parentDomainId: 1,
      created: new Date(2023, 4, 28), // May 28, 2023
      records: 1,
      isActive: true
    });
    
    this.subdomains.set(3, {
      id: 3,
      name: "dev.blockchain",
      parentDomainId: 3,
      created: new Date(2023, 6, 5), // July 5, 2023
      records: 2,
      isActive: true
    });
    
    this.subdomains.set(4, {
      id: 4,
      name: "api.blockchain",
      parentDomainId: 3,
      created: new Date(2023, 6, 10), // July 10, 2023
      records: 1,
      isActive: true
    });
    
    this.domainIdCounter = 5;
    this.subdomainIdCounter = 5;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      walletAddress: insertUser.walletAddress || null 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Domain methods
  async getDomain(id: number): Promise<Domain | undefined> {
    return this.domains.get(id);
  }
  
  async getDomainByName(name: string, tld?: string): Promise<Domain | undefined> {
    // If the input contains a dot, split it to extract name and TLD
    if (name.includes('.')) {
      const parts = name.split('.');
      const domainName = parts.slice(0, -1).join('.');
      const domainTld = parts[parts.length - 1];
      
      return Array.from(this.domains.values()).find(
        (domain) => domain.name.toLowerCase() === domainName.toLowerCase() && 
                    domain.tld.toLowerCase() === domainTld.toLowerCase()
      );
    } else {
      // If tld is provided as a separate parameter
      if (tld) {
        return Array.from(this.domains.values()).find(
          (domain) => domain.name.toLowerCase() === name.toLowerCase() && 
                      domain.tld.toLowerCase() === tld.toLowerCase()
        );
      } else {
        // Just match by name if no TLD is specified
        return Array.from(this.domains.values()).find(
          (domain) => domain.name.toLowerCase() === name.toLowerCase()
        );
      }
    }
  }
  
  async getDomainsByOwner(owner: string): Promise<Domain[]> {
    return Array.from(this.domains.values()).filter(
      (domain) => domain.owner.toLowerCase() === owner.toLowerCase()
    );
  }
  
  async createDomain(insertDomain: InsertDomain): Promise<Domain> {
    const id = this.domainIdCounter++;
    const now = new Date();
    
    const domain: Domain = {
      ...insertDomain,
      id,
      registered: now,
      transactionHash: insertDomain.transactionHash || null,
      tokenId: insertDomain.tokenId || null,
      isActive: insertDomain.isActive !== undefined ? insertDomain.isActive : true,
    };
    
    this.domains.set(id, domain);
    return domain;
  }
  
  async updateDomain(id: number, updates: Partial<InsertDomain>): Promise<Domain | undefined> {
    const domain = this.domains.get(id);
    if (!domain) return undefined;
    
    const updatedDomain = { ...domain, ...updates };
    this.domains.set(id, updatedDomain);
    return updatedDomain;
  }
  
  // Subdomain methods
  async getSubdomain(id: number): Promise<Subdomain | undefined> {
    return this.subdomains.get(id);
  }
  
  async getSubdomainsByDomainId(domainId: number): Promise<Subdomain[]> {
    return Array.from(this.subdomains.values()).filter(
      (subdomain) => subdomain.parentDomainId === domainId
    );
  }
  
  async createSubdomain(insertSubdomain: InsertSubdomain): Promise<Subdomain> {
    const id = this.subdomainIdCounter++;
    const now = new Date();
    
    const subdomain: Subdomain = {
      ...insertSubdomain,
      id,
      created: now,
      isActive: insertSubdomain.isActive !== undefined ? insertSubdomain.isActive : true,
      records: insertSubdomain.records || 0,
    };
    
    this.subdomains.set(id, subdomain);
    return subdomain;
  }
  
  async updateSubdomain(id: number, updates: Partial<InsertSubdomain>): Promise<Subdomain | undefined> {
    const subdomain = this.subdomains.get(id);
    if (!subdomain) return undefined;
    
    const updatedSubdomain = { ...subdomain, ...updates };
    this.subdomains.set(id, updatedSubdomain);
    return updatedSubdomain;
  }
  
  async deleteSubdomain(id: number): Promise<boolean> {
    return this.subdomains.delete(id);
  }
}

export const storage = new MemStorage();
