import { generateText, Output } from "ai";
import { z } from "zod";
import { buildEvaluationPrompt } from "./prompts";

export const evaluationSchema = z.object({
  grade: z.enum(["A", "B", "C", "D", "F"]),
  score: z.number().min(0).max(100),
  summary: z.string(),
  resumeFit: z.number().min(0).max(100),
  seniorityMatch: z.number().min(0).max(100),
  locationMatch: z.number().min(0).max(100),
  compensationMatch: z.number().min(0).max(100),
  keywordOverlap: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  keywords: z.array(z.string()),
});

export type EvaluationResult = z.infer<typeof evaluationSchema>;

export async function evaluateJob(params: {
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  baseResume: string;
  targetRoles: string[];
  targetRegions: string[];
}) {
  const startTime = Date.now();

  const { output, usage } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    output: Output.object({ schema: evaluationSchema }),
    prompt: buildEvaluationPrompt(params),
  });

  return {
    evaluation: output,
    usage,
    durationMs: Date.now() - startTime,
  };
}
