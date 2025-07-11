import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
export type Claim = typeof claims.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;

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
