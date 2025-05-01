import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchDomainSchema, insertDomainSchema, insertSubdomainSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Available TLDs
  const AVAILABLE_TLDS = [
    { tld: "eth", price: "0.05", description: "Ethereum Name Service" },
    { tld: "com", price: "0.1", description: "Commercial websites" },
    { tld: "org", price: "0.08", description: "Organizations" },
    { tld: "in", price: "0.075", description: "Indian websites" },
    { tld: "tech", price: "0.12", description: "Technology websites" },
    { tld: "app", price: "0.15", description: "Application websites" },
  ];
  
  // Get available TLDs
  app.get("/api/tlds", (req: Request, res: Response) => {
    res.json(AVAILABLE_TLDS);
  });
  
  // Domain routes
  app.get("/api/domains/search", async (req: Request, res: Response) => {
    try {
      const { name, tld } = searchDomainSchema.parse(req.query);
      
      // Check if the name already includes a TLD
      if (name.includes('.')) {
        // The name contains a dot, assume it's a full domain name
        const parts = name.split('.');
        const baseName = parts.slice(0, -1).join('.');
        const domainTld = parts[parts.length - 1];
        
        const domain = await storage.getDomainByName(baseName, domainTld);
        
        return res.json({
          name: name,
          baseName: baseName,
          tld: domainTld,
          available: !domain,
        });
      } else {
        // The name does not contain a dot, use the provided TLD
        const domain = await storage.getDomainByName(name, tld);
        
        return res.json({
          name: `${name}.${tld}`,
          tld: tld,
          baseName: name,
          available: !domain,
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/domains/my", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      const domains = await storage.getDomainsByOwner(walletAddress);
      return res.json(domains);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/domains/:id", async (req: Request, res: Response) => {
    try {
      const domainId = parseInt(req.params.id);
      
      if (isNaN(domainId)) {
        return res.status(400).json({ message: "Invalid domain ID" });
      }
      
      const domain = await storage.getDomain(domainId);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      return res.json(domain);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/domains/register", async (req: Request, res: Response) => {
    try {
      const domainData = insertDomainSchema.parse(req.body);
      
      // Handle if name contains TLD
      let name = domainData.name;
      let tld = domainData.tld;
      
      if (name.includes('.')) {
        // Extract name and TLD from the full domain name
        const parts = name.split('.');
        name = parts.slice(0, -1).join('.');
        tld = parts[parts.length - 1];
        
        // Update the domain data
        domainData.name = name;
        domainData.tld = tld;
      }
      
      // Check if domain already exists
      const existingDomain = await storage.getDomainByName(name, tld);
      if (existingDomain) {
        return res.status(409).json({ message: `Domain ${name}.${tld} is already registered` });
      }
      
      // Create domain
      const domain = await storage.createDomain(domainData);
      return res.status(201).json(domain);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subdomain routes
  app.get("/api/domains/:domainId/subdomains", async (req: Request, res: Response) => {
    try {
      const domainId = parseInt(req.params.domainId);
      
      if (isNaN(domainId)) {
        return res.status(400).json({ message: "Invalid domain ID" });
      }
      
      const domain = await storage.getDomain(domainId);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      const subdomains = await storage.getSubdomainsByDomainId(domainId);
      return res.json(subdomains);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/domains/:domainId/subdomains", async (req: Request, res: Response) => {
    try {
      const domainId = parseInt(req.params.domainId);
      
      if (isNaN(domainId)) {
        return res.status(400).json({ message: "Invalid domain ID" });
      }
      
      const domain = await storage.getDomain(domainId);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      const subdomainData = insertSubdomainSchema.parse({
        ...req.body,
        parentDomainId: domainId
      });
      
      const subdomain = await storage.createSubdomain(subdomainData);
      return res.status(201).json(subdomain);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/subdomains/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subdomain ID" });
      }
      
      const subdomain = await storage.getSubdomain(id);
      if (!subdomain) {
        return res.status(404).json({ message: "Subdomain not found" });
      }
      
      const updates = req.body;
      const updatedSubdomain = await storage.updateSubdomain(id, updates);
      
      return res.json(updatedSubdomain);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/subdomains/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subdomain ID" });
      }
      
      const subdomain = await storage.getSubdomain(id);
      if (!subdomain) {
        return res.status(404).json({ message: "Subdomain not found" });
      }
      
      await storage.deleteSubdomain(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
