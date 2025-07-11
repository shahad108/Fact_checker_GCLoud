import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeClaim } from "./services/openai";
import { insertClaimSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (simplified - in real app would use authentication)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1); // Default user
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user stats
  app.get("/api/user/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats(1);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get recent activity
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(1, limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Submit claim for analysis
  app.post("/api/claims", async (req, res) => {
    try {
      const validatedData = insertClaimSchema.parse(req.body);
      
      // Create claim with pending status
      const claim = await storage.createClaim({
        ...validatedData,
        userId: 1, // Default user
      });

      res.json(claim);

      // Start analysis in background
      analyzeClaim(validatedData.text, {
        deepAnalysis: validatedData.deepAnalysis ?? false,
        realTimeSources: validatedData.realTimeSources ?? false,
        analysisType: (validatedData.analysisType as "standard" | "premium" | "expert") ?? "standard",
      })
        .then(async (result) => {
          // Update claim with analysis results
          await storage.updateClaim(claim.id, {
            status: "completed",
            reliabilityScore: result.reliabilityScore,
            analysis: result.analysis,
            sources: result.sources,
            completedAt: new Date(),
          });

          // Store sources
          for (const source of result.sources) {
            await storage.createSource({
              claimId: claim.id,
              title: source.title,
              url: source.url,
              domain: source.domain,
              credibilityScore: source.credibilityScore,
              excerpt: source.excerpt,
            });
          }
        })
        .catch(async (error) => {
          console.error("Analysis failed:", error);
          await storage.updateClaim(claim.id, {
            status: "failed",
            analysis: "Analysis failed due to technical issues. Please try again.",
          });
        });
    } catch (error) {
      res.status(400).json({ message: "Invalid claim data" });
    }
  });

  // Get claim by ID
  app.get("/api/claims/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const claim = await storage.getClaim(id);
      
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Get sources for this claim
      const sources = await storage.getSourcesByClaimId(id);
      
      res.json({
        ...claim,
        sourceDetails: sources,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  // Get user's claims
  app.get("/api/claims", async (req, res) => {
    try {
      const claims = await storage.getClaimsByUserId(1);
      res.json(claims);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Get sources for a claim
  app.get("/api/claims/:id/sources", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sources = await storage.getSourcesByClaimId(id);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
