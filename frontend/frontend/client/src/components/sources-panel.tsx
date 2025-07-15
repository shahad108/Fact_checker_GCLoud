import { ExternalLink, Check, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Claim } from "@shared/schema";

interface SourcesPanelProps {
  claim: Claim;
}

export default function SourcesPanel({ claim }: SourcesPanelProps) {
  const sources = claim.sources as any[] || [];
  const avgCredibility = sources.length > 0 
    ? sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length 
    : 0;

  const getCredibilityClass = (score: number) => {
    if (score >= 80) return "credibility-high";
    if (score >= 60) return "credibility-medium";
    return "credibility-low";
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  };

  return (
    <>
      {/* Sources Overview */}
      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Sources</h3>
            <Button variant="link" className="text-primary p-0">
              View All
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Average Credibility</span>
              <span className="text-2xl font-bold text-green-600">
                {avgCredibility.toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${avgCredibility}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Based on {sources.length} sources
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:border-primary transition-all cursor-pointer hover-lift"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-bold ${getCredibilityClass(source.credibilityScore)}`}
                  >
                    Credibility: {source.credibilityScore}%
                  </Badge>
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1 hover:text-primary">
                  {source.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {source.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-primary font-medium">{source.domain}</span>
                  <span className="text-xs text-gray-500">Click to view source</span>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Verification Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Cross-referenced</span>
              </div>
              <span className="text-xs text-green-600 font-medium">
                {sources.length} sources
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Fact-checked</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Expert Review</span>
              </div>
              <span className="text-xs text-yellow-600 font-medium">Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
