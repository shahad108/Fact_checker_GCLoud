import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, User, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProgressRing from "@/components/ui/progress-ring";
import ProgressCircle from "@/components/ui/progress-circle";
import { Claim, CreateClaim, BackendClaim, BackendAnalysis, BackendSource } from "@shared/schema";

interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "analysis";
  content: string;
  timestamp: Date;
  claim?: Claim;
}

// Utility to convert backend claim to frontend format for display
function mapBackendClaimToFrontend(backendClaim: BackendClaim, analysis?: BackendAnalysis, sources?: BackendSource[]): Claim {
  return {
    id: parseInt(backendClaim.id.split('-')[0], 16), // Convert UUID to number for display
    userId: parseInt(backendClaim.user_id.split('-')[0], 16),
    text: backendClaim.claim_text,
    reliabilityScore: analysis ? Math.round(analysis.veracity_score * 100) : 0,
    analysis: analysis?.analysis_text || "",
    sources: sources ? sources
      .map(source => {
        // Extract domain from URL if domain_name is empty
        let domain = source.domain_name;
        if (!domain || domain.trim() === '') {
          try {
            domain = new URL(source.url).hostname;
          } catch {
            domain = source.url;
          }
        }
        
        return {
          title: source.title,
          url: source.url,
          domain: domain,
          credibilityScore: Math.round((source.credibility_score || 0) * 100),
          excerpt: source.snippet,
        };
      })
      .sort((a, b) => b.credibilityScore - a.credibilityScore) // Sort by credibility: highest to lowest
      : [],
    status: backendClaim.status === "analyzed" ? "completed" : backendClaim.status,
    deepAnalysis: false,
    realTimeSources: true,
    analysisType: "standard",
    createdAt: new Date(backendClaim.created_at),
    completedAt: analysis ? new Date(analysis.created_at) : null,
  };
}

export default function FactChecker() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "What would you like to verify today?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data (temporarily commented out until Auth0 is added)
  // const { data: user } = useQuery({
  //   queryKey: ["/api/user"],
  //   staleTime: 5 * 60 * 1000,
  // });

  // Submit claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: async (data: { claimData: CreateClaim; claimSubmissionId: string }) => {
      const response = await apiRequest("POST", "/v1/claims/analyze-test", data.claimData);
      return { ...await response.json(), claimSubmissionId: data.claimSubmissionId };
    },
    onSuccess: (analysisResponse: any) => {
      // The /analyze endpoint returns a ClaimAnalysisResponse with both claim and analysis
      const { claim: backendClaim, analysis, claimSubmissionId } = analysisResponse;
      
      console.log('✅ ANALYSIS COMPLETED:', {
        claimId: backendClaim.id,
        submissionId: claimSubmissionId,
        score: analysis.veracity_score,
        hasAnalysis: !!analysis.analysis_text
      });
      
      // Convert backend claim to frontend format with analysis
      const claim = mapBackendClaimToFrontend(backendClaim, analysis, analysis.sources || []);
      
      // Replace the pending message with the real analysis
      const analysisMessage: ChatMessage = {
        id: `analysis-${claimSubmissionId}`,
        type: "analysis",
        content: "Here is my analysis:",
        timestamp: new Date(),
        claim: claim
      };
      
      // Replace only the specific pending message with this submission ID
      setMessages(prev => {
        return prev.map(msg => 
          msg.id === `analysis-${claimSubmissionId}` 
            ? analysisMessage 
            : msg
        );
      });
      
      toast({
        title: "Analysis Complete",
        description: `Reliability Score: ${claim.reliabilityScore}%`,
      });
    },
    onError: (error, variables) => {
      console.error("Analysis error:", error);
      
      // Remove only the specific pending message that failed
      setMessages(prev => 
        prev.filter(msg => 
          msg.id !== `analysis-${variables.claimSubmissionId}`
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to submit claim for analysis.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || submitClaimMutation.isPending) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Generate unique claim ID for this submission
    const claimSubmissionId = `claim-${Date.now()}`;
    
    // Add pending analysis message with a temporary claim to show loading UI
    const pendingClaim: Claim = {
      id: claimSubmissionId,
      claimText: inputText,
      status: "pending",
      verifiedAt: new Date(),
      reliabilityScore: 0,
      sources: [],
      summary: "",
      fullAnalysis: ""
    };
    
    const pendingAnalysisMessage: ChatMessage = {
      id: `analysis-${claimSubmissionId}`,
      type: "analysis",
      content: "Analyzing your claim...",
      timestamp: new Date(),
      claim: pendingClaim
    };
    setMessages(prev => [...prev, pendingAnalysisMessage]);
    
    // Submit claim
    submitClaimMutation.mutate({
      claimData: {
        claim_text: inputText,
        context: "", // Empty context for now
        language: "english",
      },
      claimSubmissionId, // Pass the ID to track this specific claim
    });
    
    setInputText("");
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content: "What would you like to verify today?",
        timestamp: new Date(),
      }
    ]);
    setInputText("");
  };

  // 🔧 DEBUG: Force display most recent completed analysis
  const forceDisplayLatestAnalysis = async () => {
    try {
      console.log('🔧 FORCE DISPLAY: Fetching latest completed analysis...');
      
      // Get all claims (should include analyses)
      const allClaimsResponse = await apiRequest("GET", `/v1/claims/`);
      const allClaims = await allClaimsResponse.json();
      
      // Find most recent completed claim with analysis
      const completedClaims = allClaims.filter(claim => 
        claim.status === "analyzed" && claim.analyses && claim.analyses.length > 0
      ) || [];
      
      if (completedClaims.length === 0) {
        toast({
          title: "No Completed Analysis",
          description: "No completed analysis found in system.",
          variant: "destructive",
        });
        return;
      }
      
      // Sort by most recent first
      const latestClaim = completedClaims.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      
      console.log('🎯 LATEST COMPLETED CLAIM:', {
        id: latestClaim.id,
        text: latestClaim.claim_text.substring(0, 50) + '...',
        updated: latestClaim.updated_at,
        analysesCount: latestClaim.analyses.length
      });
      
      // Use the first analysis from the claim
      const analysis = latestClaim.analyses[0];
      console.log('📊 ANALYSIS:', {
        id: analysis.id,
        score: analysis.veracity_score,
        textLength: analysis.analysis_text?.length,
        sourcesCount: analysis.sources?.length || 0
      });
      
      const updatedClaim = mapBackendClaimToFrontend(latestClaim, analysis, analysis.sources || []);
      
      // Force add to messages
      const forceMessage = {
        id: `force-${Date.now()}`,
        type: "analysis" as const,
        content: "🔧 FORCE DISPLAYED: Latest completed analysis:",
        timestamp: new Date(),
        claim: updatedClaim
      };
      
      setMessages(prev => [...prev, forceMessage]);
      
      toast({
        title: "Latest Analysis Displayed",
        description: `${Math.round(analysis.veracity_score * 100)}% reliability, ${analysis.sources?.length || 0} sources`,
      });
    } catch (error) {
      console.error('❌ Force display error:', error);
      toast({
        title: "Force Display Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderAnalysisCard = (claim: Claim) => {
    const score = claim.reliabilityScore || 0;
    const sources = claim.sources as any[] || [];
    const avgCredibility = sources.length > 0 
      ? Math.round(sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length)
      : 0;

    if (claim.status === "pending") {
      return (
        <Card className="max-w-4xl bg-white shadow-lg border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <ProgressCircle
                isActive={claim.status === "pending"}
                size={80}
                strokeWidth={6}
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 text-lg mb-1">Analyzing your claim</h3>
                <p className="text-sm text-blue-600 mb-3">Searching for reliable sources and evaluating credibility...</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-600">Gathering information from multiple sources</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-200"></div>
                    <p className="text-xs text-gray-600">Cross-referencing claims with verified data</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-400"></div>
                    <p className="text-xs text-gray-600">Evaluating source credibility and bias</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-4xl bg-white shadow-lg border border-gray-200 animate-fade-in">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Reliability Score */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex flex-col items-center">
                  <h3 className="font-semibold text-gray-600 mb-2">Reliability Score</h3>
                  <ProgressRing value={score} size={120} strokeWidth={6} />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-green-600 mb-2">
                    {score >= 80 ? "The claim is reliable," : score >= 60 ? "The claim is partially reliable," : "The claim has low reliability,"}
                  </h4>
                  <p className="text-lg text-gray-600">
                    {score >= 80 ? "you can share with your network." : score >= 60 ? "verify before sharing." : "more verification needed."}
                  </p>
                </div>
              </div>
              
              {/* Analysis Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 leading-relaxed">
                  {claim.analysis || "Analysis is being processed..."}
                </p>
              </div>
            </div>

            {/* Sources Panel */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Sources</h3>
                  <Button variant="link" className="text-primary p-0 text-sm">
                    User Guidelines
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-700">Avg. Source Credibility</h4>
                      <p className="text-xs text-gray-500">Based on {sources.length} sources</p>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-gray-800">{Math.round(avgCredibility / 10)}</span>
                      <p className="text-sm font-semibold text-green-600">{avgCredibility}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {sources.map((source, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs font-bold text-green-700 bg-green-100">
                            Credibility: {source.credibilityScore}%
                          </Badge>
                        </div>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                            {source.title}
                          </h4>
                        </a>
                        <p className="text-xs text-primary mb-2">{source.domain}</p>
                        {source.excerpt && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {source.excerpt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Wahrify</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={forceDisplayLatestAnalysis} variant="outline" size="sm" className="text-xs">
                🔧 Force Latest
              </Button>
              <Button onClick={handleNewChat} className="hover-lift">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                {message.type === "user" ? (
                  <div className="bg-green-200 text-gray-800 p-4 rounded-lg rounded-br-none shadow-sm max-w-2xl animate-fade-in">
                    <p>{message.content}</p>
                  </div>
                ) : message.type === "assistant" ? (
                  <div className="bg-white p-4 rounded-lg rounded-bl-none border border-gray-200 shadow-sm max-w-2xl animate-fade-in">
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                ) : (
                  <div className="w-full animate-fade-in">
                    <div className="bg-white p-4 rounded-lg rounded-bl-none border border-gray-200 shadow-sm mb-4 max-w-2xl">
                      <p className="text-lg font-semibold text-gray-800">{message.content}</p>
                    </div>
                    {message.claim && renderAnalysisCard(message.claim)}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 sticky bottom-0">
        <div className="max-w-xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <AutoResizeTextarea
                placeholder="Start typing or paste text of a new claim here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="rounded-2xl pr-12"
                disabled={submitClaimMutation.isPending}
                minLines={1}
                maxLines={8}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 bottom-2 rounded-full"
                disabled={!inputText.trim() || submitClaimMutation.isPending}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
