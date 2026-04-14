import { JSONSchemaType } from "json-schema-to-typescript";

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
  parse(schema: Record<string, any>, rawResponse: string): Promise<unknown>;
  validate(data: unknown, schema: Record<string, any>): boolean;
}

export class StructuredOutputParserImpl implements StructuredOutputParser {
  private async fixJson(schema: Record<string, any>, rawResponse: string): Promise<unknown> {
    // In a real-world scenario, this would involve calling an LLM API
    // with a prompt like: "The following text is supposed to be JSON matching schema X.
    // Please correct it: [rawResponse]"
    // For this implementation, we simulate a fix by attempting a simple cleanup
    // and assuming the LLM call succeeds if the initial parse fails.

    console.warn("Simulating LLM call to fix JSON structure based on schema.");
    try {
      // Simple heuristic: remove common markdown wrappers if they are the only issue
      let cleanedResponse = rawResponse.trim();
      if (cleanedResponse.startsWith("json")) {
        cleanedResponse = cleanedResponse.substring(7).trim();
      }
      if (cleanedResponse.endsWith("")) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3).trim();
      }
      return JSON.parse(cleanedResponse);
    } catch (e) {
      throw new Error("Failed to fix JSON structure even after heuristic cleanup.");
    }
  }

  public async parse(schema: Record<string, any>, rawResponse: string): Promise<unknown> {
    try {
      // 1. Attempt direct JSON parsing
      const parsed = JSON.parse(rawResponse);
      return parsed;
    } catch (e) {
      console.error("Initial JSON parsing failed. Attempting structural fix.");
      // 2. Fallback to structural fixing mechanism
      return this.fixJson(schema, rawResponse);
    }
  }

  public validate(data: unknown, schema: Record<string, any>): boolean {
    // Use a library like 'ajv' in a real scenario.
    // Since we cannot use external dependencies, we will provide a placeholder
    // that relies on the existence of the schema structure for demonstration.
    try {
      // This simulates validation by checking if the data structure matches
      // the expected types derived from the schema structure.
      const schemaType = JSONSchemaType<unknown>(schema);
      const validatedData = schemaType(data);
      return validatedData !== null;
    } catch (e) {
      return false;
    }
  }
}

export const structuredOutputParser: StructuredOutputParser = new StructuredOutputParserImpl();