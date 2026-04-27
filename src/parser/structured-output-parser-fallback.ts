import { structuredoutputparser } from "./structured-output-parser";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

export class StructuredOutputParserFallback extends structuredoutputparser {
  parse(content: string): { message: Message; success: boolean; fallback_details?: { error: string; extracted_content: string } } {
    try {
      const structuredResult = super.parse(content);
      return { message: structuredResult, success: true };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown parsing error";
      const fallbackDetails = this.fallbackParse(content, error);
      return {
        message: {
          role: "assistant",
          content: [
            { type: "text", text: `[Parsing Failed] Attempting fallback extraction. Error: ${error}` },
            ...fallbackDetails.extracted_content.map(block => ({ type: "text", text: block }))
          ]
        } as AssistantMessage,
        success: false,
        fallback_details: fallbackDetails
      };
    }
  }

  private fallbackParse(content: string, primaryError: string): { error: string; extracted_content: string[] } {
    let extractedText = content;
    let error = `Primary structured parsing failed: ${primaryError}.`;

    // Heuristic 1: Attempt to find JSON structure even if invalid
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedText = `Potential JSON structure found: ${jsonMatch[0]}`;
    } else {
      extractedText = `No obvious JSON structure found. Using raw content for fallback analysis.`;
    }

    // Heuristic 2: Simple regex extraction for key-value pairs (very basic)
    const kvpRegex = /([a-zA-Z0-9_]+):\s*([^\n,]+)/g;
    let kvpMatches: string[] = [];
    let match;
    while ((match = kvpRegex.exec(content)) !== null) {
      kvpMatches.push(`${match[1]}: ${match[2]}`);
    }

    let finalContent: string[] = [];
    if (kvpMatches.length > 0) {
      finalContent.push(new TextBlock("text", `Extracted Key-Value Pairs: ${kvpMatches.join(", ")}`));
    } else {
      finalContent.push(new TextBlock("text", `Fallback analysis complete. Raw content snippet: ${extractedText.substring(0, Math.min(200, content.length))}...`));
    }

    return {
      error: error,
      extracted_content: finalContent
    };
  }
}