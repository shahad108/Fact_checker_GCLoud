import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Star, User, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProgressRing from "@/components/ui/progress-ring";
import { Claim } from "@shared/schema";

interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "analysis";
  content: string;
  timestamp: Date;
  claim?: Claim;
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    staleTime: 5 * 60 * 1000,
  });

  // Submit claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: async (claimData: any) => {
      const response = await apiRequest("POST", "/api/claims", claimData);
      return response.json();
    },
    onSuccess: (claim) => {
      setIsAnalyzing(true);
      
      // Add analysis message
      const analysisMessage: ChatMessage = {
        id: `analysis-${claim.id}`,
        type: "analysis",
        content: "Here is my analysis:",
        timestamp: new Date(),
        claim: claim
      };
      setMessages(prev => [...prev, analysisMessage]);
      
      // Poll for completion
      const pollInterval = setInterval(() => {
        queryClient.fetchQuery({
          queryKey: ["/api/claims", claim.id],
        }).then((updatedClaim: any) => {
          if (updatedClaim.status === "completed" || updatedClaim.status === "failed") {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            
            // Update the analysis message with completed claim
            setMessages(prev => prev.map(msg => 
              msg.id === `analysis-${claim.id}` 
                ? { ...msg, claim: updatedClaim }
                : msg
            ));
            
            if (updatedClaim.status === "completed") {
              toast({
                title: "Analysis Complete",
                description: "Your claim has been successfully analyzed.",
              });
            } else {
              toast({
                title: "Analysis Failed",
                description: "There was an error analyzing your claim. Please try again.",
                variant: "destructive",
              });
            }
          }
        });
      }, 2000);
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: "Failed to submit claim for analysis.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAnalyzing) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Submit claim
    submitClaimMutation.mutate({
      text: inputText,
      deepAnalysis: false,
      realTimeSources: true, // Enable real Google search by default
      analysisType: "standard",
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
    setIsAnalyzing(false);
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

    if (claim.status === "pending" || isAnalyzing) {
      return (
        <Card className="max-w-4xl bg-white shadow-lg border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Analyzing your claim</h3>
                <p className="text-sm text-blue-600">This may take a moment...</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
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
                        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                          {source.title}
                        </h4>
                        <p className="text-xs text-primary">{source.domain}</p>
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
            <Button onClick={handleNewChat} className="hover-lift">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
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
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Start typing or paste text of a new claim here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-gray-100 border-gray-300 rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isAnalyzing}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                disabled={!inputText.trim() || isAnalyzing}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current cursor-pointer hover:text-yellow-500" />
              ))}
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
