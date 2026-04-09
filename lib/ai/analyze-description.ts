import { generateText, Output } from "ai";
import { z } from "zod";
import { buildAnalysisPrompt } from "./prompts";

export const analysisSchema = z.object({
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  requiredExperience: z.string(),
  keyResponsibilities: z.array(z.string()),
  atsKeywords: z.array(z.string()),
  seniorityLevel: z.string(),
  redFlags: z.array(z.string()),
  estimatedSalaryRange: z.string().optional(),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

export async function analyzeDescription(description: string) {
  const startTime = Date.now();

  const { output, usage } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    output: Output.object({ schema: analysisSchema }),
    prompt: buildAnalysisPrompt(description),
  });

  return {
    analysis: output,
    usage,
    durationMs: Date.now() - startTime,
  };
}
