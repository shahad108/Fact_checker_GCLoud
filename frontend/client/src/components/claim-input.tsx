import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface ClaimInputProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function ClaimInput({ onSubmit, isLoading }: ClaimInputProps) {
  const [claimText, setClaimText] = useState("");
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [realTimeSources, setRealTimeSources] = useState(false);
  const [analysisType, setAnalysisType] = useState("standard");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) return;

    onSubmit({
      text: claimText,
      deepAnalysis,
      realTimeSources,
      analysisType,
    });
  };

  const charCount = claimText.length;
  const maxChars = 1000;

  return (
    <Card className="shadow-lg border-gray-200 mb-6 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Claim Analysis</h3>
            <p className="text-sm text-gray-600">
              Enter a claim to verify its accuracy using our advanced AI system
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="Enter your claim here... (e.g., 'The GBU-57 bomb penetrates 200 feet underground')"
              className="min-h-[100px] bg-gray-50 border-gray-300 resize-none pr-20"
              maxLength={maxChars}
            />
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {charCount}/{maxChars}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!claimText.trim() || isLoading}
                className="hover-lift"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deep-analysis"
                  checked={deepAnalysis}
                  onCheckedChange={setDeepAnalysis}
                />
                <label
                  htmlFor="deep-analysis"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Deep Analysis
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="real-time-sources"
                  checked={realTimeSources}
                  onCheckedChange={setRealTimeSources}
                />
                <label
                  htmlFor="real-time-sources"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Real-time Sources
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Analysis Type:</span>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
