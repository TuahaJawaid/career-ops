import { streamText } from "ai";
import { buildTailoringPrompt } from "./prompts";

export function tailorResume(params: {
  baseResume: string;
  jobDescription: string;
  jobTitle: string;
  company: string;
  keywords: string[];
}) {
  return streamText({
    model: "anthropic/claude-sonnet-4.6",
    prompt: buildTailoringPrompt(params),
  });
}
