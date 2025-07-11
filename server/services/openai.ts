import OpenAI from "openai";
import { AnalysisResult, analysisResultSchema } from "@shared/schema";

// Using OpenRouter for access to various AI models
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "default_key",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://wahrify.app",
    "X-Title": "Wahrify Fact Checker",
  }
});

export async function analyzeClaim(
  claimText: string,
  options: {
    deepAnalysis?: boolean;
    realTimeSources?: boolean;
    analysisType?: "standard" | "premium" | "expert";
  } = {}
): Promise<AnalysisResult> {
  try {
    const systemPrompt = `You are an advanced fact-checking AI system. Analyze the given claim and provide a comprehensive verification report in JSON format.

Your analysis should include:
1. A reliability score (0-100) based on available evidence
2. Detailed analysis explaining your findings
3. Source quality assessment (0-100)
4. Fact consistency rating (0-100)
5. Bias detection level (low/medium/high)
6. Recency score (0-100) based on how current the information is
7. Confidence level (low/medium/high)
8. A list of relevant sources with credibility scores

Be thorough, objective, and base your analysis on verifiable information. If you cannot verify a claim, explain why and what additional information would be needed.

Respond with JSON in this exact format:
{
  "reliabilityScore": number,
  "analysis": "string",
  "sourceQuality": number,
  "factConsistency": number,
  "biasDetection": "low"|"medium"|"high",
  "recency": number,
  "confidenceLevel": "low"|"medium"|"high",
  "sources": [
    {
      "title": "string",
      "url": "string",
      "domain": "string",
      "credibilityScore": number,
      "excerpt": "string"
    }
  ]
}`;

    const userPrompt = `Analyze this claim: "${claimText}"

Analysis type: ${options.analysisType || "standard"}
Deep analysis: ${options.deepAnalysis ? "enabled" : "disabled"}
Real-time sources: ${options.realTimeSources ? "enabled" : "disabled"}

Please provide a comprehensive fact-check analysis.`;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const rawResult = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate the result against our schema
    const result = analysisResultSchema.parse(rawResult);
    
    return result;
  } catch (error) {
    console.error("OpenAI analysis failed:", error);
    throw new Error(`Failed to analyze claim: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSourceSummary(sources: any[]): Promise<string> {
  try {
    const prompt = `Summarize the key findings from these sources for a fact-check analysis:

${sources.map(source => `- ${source.title} (${source.domain}): ${source.excerpt}`).join('\n')}

Provide a concise summary of what these sources collectively say about the claim.`;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Source summary generation failed:", error);
    throw new Error("Failed to generate source summary");
  }
}
