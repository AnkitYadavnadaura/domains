import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
});

export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tld: text("tld").notNull(), // Top-level domain (.com, .org, .eth, etc.)
  owner: text("owner").notNull(), // wallet address
  registered: timestamp("registered").notNull().defaultNow(),
  expires: timestamp("expires").notNull(),
  price: text("price").notNull(), // in ETH, stored as string for precision
  transactionHash: text("transaction_hash"),
  tokenId: integer("token_id"), // NFT token ID
  isActive: boolean("is_active").notNull().default(true),
});

export const subdomains = pgTable("subdomains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentDomainId: integer("parent_domain_id").notNull(),
  created: timestamp("created").notNull().defaultNow(),
  records: integer("records").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  registered: true,
}).extend({
  expires: z.string().refine((value) => {
    try {
      new Date(value);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Invalid date format"
  }).transform(value => new Date(value)),
});

export const insertSubdomainSchema = createInsertSchema(subdomains).omit({
  id: true,
  created: true,
});

// Search domain schema
export const searchDomainSchema = z.object({
  name: z.string().min(1),
  tld: z.string().min(1).default("eth"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;

export type InsertSubdomain = z.infer<typeof insertSubdomainSchema>;
export type Subdomain = typeof subdomains.$inferSelect;
