import { CheckCircle, TrendingUp, Shield, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProgressRing from "./ui/progress-ring";
import { Claim } from "@shared/schema";

interface ReliabilityScoreProps {
  claim: Claim;
}

export default function ReliabilityScore({ claim }: ReliabilityScoreProps) {
  const score = claim.reliabilityScore || 0;
  const sources = claim.sources as any[] || [];
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Highly Credible";
    if (score >= 60) return "Moderately Credible";
    return "Low Credibility";
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "high": return "text-green-600";
      case "medium": return "text-yellow-600";
      default: return "text-red-600";
    }
  };

  // Mock breakdown metrics based on the score
  const sourceQuality = Math.min(100, score + 7);
  const factConsistency = Math.min(100, score + 3);
  const biasDetection = score >= 80 ? "Low" : score >= 60 ? "Medium" : "High";
  const recency = Math.max(60, score - 7);

  return (
    <Card className="shadow-lg border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Reliability Assessment</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Confidence Level:</span>
            <Badge variant="secondary" className={getConfidenceColor("high")}>
              High
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
            <div className="mb-4">
              <ProgressRing value={score} size={128} strokeWidth={8} />
            </div>
            <p className={`text-lg font-semibold ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </p>
            <p className="text-sm text-gray-600 text-center">
              Based on {sources.length} verified sources
            </p>
          </div>

          {/* Breakdown Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Source Quality</span>
              </div>
              <span className="text-sm font-bold text-green-600">{sourceQuality}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium">Fact Consistency</span>
              </div>
              <span className="text-sm font-bold text-green-600">{factConsistency}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Bias Detection</span>
              </div>
              <span className="text-sm font-bold text-green-600">{biasDetection}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium">Recency</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{recency}%</span>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            {claim.analysis || "Analysis is being processed..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
