import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Backend API types (matching PostgreSQL schema)
export const backendClaimSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  claim_text: z.string(),
  context: z.string(),
  status: z.enum(["pending", "analyzing", "analyzed", "disputed", "verified", "rejected", "failed"]),
  language: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  batch_user_id: z.string().nullable().optional(),
  batch_post_id: z.string().nullable().optional(),
  embedding: z.array(z.number()).nullable().optional(),
});

export const backendSourceSchema = z.object({
  id: z.string().uuid(),
  search_id: z.string().uuid().optional(), // May not be included in flattened response
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  credibility_score: z.number().min(0).max(1).nullable().optional(),
  domain_name: z.string().optional(), // Flattened from domain object
  domain_credibility: z.number().min(0).max(1).optional(), // Flattened from domain object
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const backendAnalysisSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  veracity_score: z.number().min(0).max(1),
  confidence_score: z.number().min(0).max(1),
  analysis_text: z.string(),
  created_at: z.string().datetime(),
  sources: z.array(backendSourceSchema).optional(), // Sources now included in analysis response
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  text: text("text").notNull(),
  reliabilityScore: integer("reliability_score"),
  analysis: text("analysis"),
  sources: json("sources"),
  status: text("status").notNull().default("pending"), // pending, analyzing, completed, failed
  deepAnalysis: boolean("deep_analysis").default(false),
  realTimeSources: boolean("real_time_sources").default(false),
  analysisType: text("analysis_type").default("standard"), // standard, premium, expert
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id),
  title: text("title").notNull(),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  credibilityScore: integer("credibility_score"),
  excerpt: text("excerpt"),
  publishedAt: timestamp("published_at"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

// Backend API schema alignment
export const createClaimSchema = z.object({
  claim_text: z.string().min(1),
  context: z.string().default(""),
  language: z.string().default("english"),
  batch_user_id: z.string().optional(),
  batch_post_id: z.string().optional(),
});

export const insertClaimSchema = createInsertSchema(claims).pick({
  text: true,
  deepAnalysis: true,
  realTimeSources: true,
  analysisType: true,
});

export const insertSourceSchema = createInsertSchema(sources).pick({
  title: true,
  url: true,
  domain: true,
  credibilityScore: true,
  excerpt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type CreateClaim = z.infer<typeof createClaimSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;

// Backend API types
export type BackendClaim = z.infer<typeof backendClaimSchema>;
export type BackendAnalysis = z.infer<typeof backendAnalysisSchema>;
export type BackendSource = z.infer<typeof backendSourceSchema>;

export const analysisResultSchema = z.object({
  reliabilityScore: z.number().min(0).max(100),
  analysis: z.string(),
  sourceQuality: z.number().min(0).max(100),
  factConsistency: z.number().min(0).max(100),
  biasDetection: z.enum(["low", "medium", "high"]),
  recency: z.number().min(0).max(100),
  confidenceLevel: z.enum(["low", "medium", "high"]),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    domain: z.string(),
    credibilityScore: z.number().min(0).max(100),
    excerpt: z.string(),
  })),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
