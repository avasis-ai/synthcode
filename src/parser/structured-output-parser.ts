export interface StructuredOutputSchema {
  type: string;
  properties?: Record<string, StructuredOutputSchema>;
  required?: string[];
  items?: StructuredOutputSchema;
  [key: string]: unknown;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export interface StructuredOutputParser {
  parse(schema: StructuredOutputSchema, rawResponse: string): Promise<unknown>;
  validate(data: unknown, schema: StructuredOutputSchema): boolean;
}

export class StructuredOutputParserImpl implements StructuredOutputParser {
  private async fixJson(schema: StructuredOutputSchema, rawResponse: string): Promise<unknown> {
    console.warn("Simulating LLM call to fix JSON structure based on schema.");
    try {
      let cleanedResponse = rawResponse.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.substring(7).trim();
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3).trim();
      }
      return JSON.parse(cleanedResponse);
    } catch {
      throw new Error("Failed to fix JSON structure even after heuristic cleanup.");
    }
  }

  public async parse(schema: StructuredOutputSchema, rawResponse: string): Promise<unknown> {
    try {
      return JSON.parse(rawResponse);
    } catch {
      console.error("Initial JSON parsing failed. Attempting structural fix.");
      return this.fixJson(schema, rawResponse);
    }
  }

  public validate(data: unknown, schema: StructuredOutputSchema): boolean {
    if (typeof data === "undefined" || data === null) return false;
    if (schema.type === "object" && typeof data !== "object") return false;
    if (schema.type === "string" && typeof data !== "string") return false;
    if (schema.type === "number" && typeof data !== "number") return false;
    if (schema.type === "boolean" && typeof data !== "boolean") return false;
    if (schema.type === "array" && !Array.isArray(data)) return false;
    if (schema.required && typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      for (const key of schema.required) {
        if (!(key in obj)) return false;
      }
    }
    return true;
  }
}

export const structuredOutputParser: StructuredOutputParser = new StructuredOutputParserImpl();
