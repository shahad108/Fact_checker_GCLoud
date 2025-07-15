import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReliabilityScore from "./reliability-score";
import SourcesPanel from "./sources-panel";
import { Claim } from "@shared/schema";

interface AnalysisResultsProps {
  claim: Claim;
  isAnalyzing: boolean;
}

export default function AnalysisResults({ claim, isAnalyzing }: AnalysisResultsProps) {
  // Fetch detailed claim data
  const { data: claimData, isLoading } = useQuery({
    queryKey: ["/api/claims", claim.id],
    enabled: !!claim.id,
    refetchInterval: isAnalyzing ? 2000 : false,
  });

  if (isLoading || isAnalyzing) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!claimData || claimData.status === "failed") {
    return (
      <Card className="shadow-lg border-red-200 mb-8 animate-fade-in">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
            <p className="text-sm text-red-600">
              {claimData?.analysis || "Unable to analyze the claim. Please try again."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (claimData.status === "pending") {
    return (
      <Card className="shadow-lg border-blue-200 mb-8 animate-fade-in">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Analyzing Claim</h3>
            <p className="text-sm text-blue-600">
              Our AI is processing your claim and verifying it against multiple sources...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
      {/* Reliability Score */}
      <div className="lg:col-span-2">
        <ReliabilityScore claim={claimData} />
      </div>

      {/* Sources Panel */}
      <div className="space-y-6">
        <SourcesPanel claim={claimData} />
      </div>
    </div>
  );
}
