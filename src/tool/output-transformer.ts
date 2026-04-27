import { z, ZodError } from "zod";

export type Message = {
    role: "user" | "assistant" | "tool";
    content: any;
};

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: any[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = {
    type: "text" | "tool_use" | "thinking";
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
    thinking?: string;
};

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

export type ToolOutputSchema = z.ZodType<any>;

export interface Transformer {
    transform(rawOutput: string, schema: ToolOutputSchema): { success: boolean; data: unknown; error: string | null };
}

class OutputTransformer implements Transformer {
    transform(rawOutput: string, schema: ToolOutputSchema): { success: boolean; data: unknown; error: string | null } {
        let parsedData: unknown;

        try {
            parsedData = JSON.parse(rawOutput);
        } catch (e) {
            return { success: false, data: null, error: "Failed to parse raw output as JSON." };
        }

        try {
            const validatedData = schema.parse(parsedData);
            return { success: true, data: validatedData, error: null };
        } catch (e) {
            if (e instanceof z.ZodError) {
                return { success: false, data: null, error: `Schema validation failed: ${e.errors.map(err => err.message).join(", ")}` };
            }
            return { success: false, data: null, error: `Unknown validation error: ${e instanceof Error ? e.message : String(e)}` };
        }
    }
}

export const outputTransformer: Transformer = new OutputTransformer();