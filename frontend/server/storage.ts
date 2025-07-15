import { users, claims, sources, type User, type InsertUser, type Claim, type InsertClaim, type Source, type InsertSource } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Claim operations
  getClaim(id: number): Promise<Claim | undefined>;
  getClaimsByUserId(userId: number): Promise<Claim[]>;
  createClaim(claim: InsertClaim & { userId: number }): Promise<Claim>;
  updateClaim(id: number, updates: Partial<Claim>): Promise<Claim | undefined>;
  
  // Source operations
  getSourcesByClaimId(claimId: number): Promise<Source[]>;
  createSource(source: InsertSource & { claimId: number }): Promise<Source>;
  
  // Analytics
  getRecentActivity(userId: number, limit?: number): Promise<any[]>;
  getUserStats(userId: number): Promise<{ totalClaims: number; verifiedClaims: number; savedClaims: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private claims: Map<number, Claim>;
  private sources: Map<number, Source>;
  private currentUserId: number;
  private currentClaimId: number;
  private currentSourceId: number;

  constructor() {
    this.users = new Map();
    this.claims = new Map();
    this.sources = new Map();
    this.currentUserId = 1;
    this.currentClaimId = 1;
    this.currentSourceId = 1;
    
    // Add default user
    this.users.set(1, {
      id: 1,
      username: "user",
      password: "password",
      name: "Dr. Sarah Johnson",
      plan: "Pro Plan",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      createdAt: new Date(),
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      plan: "free",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    return this.claims.get(id);
  }

  async getClaimsByUserId(userId: number): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(
      (claim) => claim.userId === userId
    );
  }

  async createClaim(claim: InsertClaim & { userId: number }): Promise<Claim> {
    const id = this.currentClaimId++;
    const newClaim: Claim = {
      ...claim,
      id,
      status: "pending",
      createdAt: new Date(),
      reliabilityScore: null,
      analysis: null,
      sources: null,
      completedAt: null,
      userId: claim.userId,
      deepAnalysis: claim.deepAnalysis ?? null,
      realTimeSources: claim.realTimeSources ?? null,
      analysisType: claim.analysisType ?? null,
    };
    this.claims.set(id, newClaim);
    return newClaim;
  }

  async updateClaim(id: number, updates: Partial<Claim>): Promise<Claim | undefined> {
    const claim = this.claims.get(id);
    if (!claim) return undefined;
    
    const updatedClaim = { ...claim, ...updates };
    this.claims.set(id, updatedClaim);
    return updatedClaim;
  }

  async getSourcesByClaimId(claimId: number): Promise<Source[]> {
    return Array.from(this.sources.values()).filter(
      (source) => source.claimId === claimId
    );
  }

  async createSource(source: InsertSource & { claimId: number }): Promise<Source> {
    const id = this.currentSourceId++;
    const newSource: Source = {
      ...source,
      id,
      addedAt: new Date(),
      publishedAt: null,
      claimId: source.claimId,
      credibilityScore: source.credibilityScore ?? null,
      excerpt: source.excerpt ?? null,
    };
    this.sources.set(id, newSource);
    return newSource;
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<any[]> {
    const userClaims = Array.from(this.claims.values())
      .filter(claim => claim.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);

    return userClaims.map(claim => ({
      id: claim.id,
      type: claim.status === "completed" ? "verified" : "analyzing",
      title: claim.status === "completed" ? "Claim verified successfully" : "Analyzing claim",
      description: claim.text.substring(0, 100) + (claim.text.length > 100 ? "..." : ""),
      timestamp: claim.createdAt,
      status: claim.status,
      reliabilityScore: claim.reliabilityScore,
    }));
  }

  async getUserStats(userId: number): Promise<{ totalClaims: number; verifiedClaims: number; savedClaims: number }> {
    const userClaims = Array.from(this.claims.values()).filter(claim => claim.userId === userId);
    const verifiedClaims = userClaims.filter(claim => claim.status === "completed");
    
    return {
      totalClaims: userClaims.length,
      verifiedClaims: verifiedClaims.length,
      savedClaims: Math.floor(verifiedClaims.length * 0.3), // Approximate saved claims
    };
  }
}

export const storage = new MemStorage();
