import { JSONSchemaType } from "ajv";

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

export type ContentBlock = any;

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
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    correctedOutput?: string;
}

export class StructuredValidator {
    private schema: any;
    private toolName: string;
    private ajv: any;

    constructor(schema: any, toolName: string) {
        this.schema = schema;
        this.toolName = toolName;
        this.ajv = new (require("ajv"))();
        this.ajv.addSchema(schema);
    }

    public validate(output: any): ValidationResult {
        const validate = this.ajv.getSchema(this.schema);
        if (!validate) {
            return { isValid: false, errors: [`Schema for ${this.toolName} not loaded correctly.`] };
        }

        const isValid = validate(output);
        const errors: string[] = [];

        if (!isValid) {
            const schemaErrors = validate.errors || [];
            errors.push(`Validation failed for ${this.toolName}.`);
            schemaErrors.forEach(err => {
                errors.push(`Path: ${err.instancePath}, Message: ${err.message}`);
            });
        }

        return {
            isValid: isValid,
            errors: errors,
        };
    }

    public async correct(output: any): Promise<string> {
        const prompt = `The following output from the tool "${this.toolName}" failed schema validation against the required JSON schema. Please correct the output to strictly adhere to the schema.

Original Output: ${JSON.stringify(output)}

Required JSON Schema: ${JSON.stringify(this.schema)}`;

        // Mocking the LLM call for demonstration purposes
        // In a real implementation, this would call an actual LLM API endpoint.
        console.log("--- Calling LLM for correction ---");
        console.log("Prompt:", prompt);

        // Simulate successful correction after one attempt
        await new Promise(resolve => setTimeout(resolve, 50));
        return JSON.stringify({ corrected_data: "This is the corrected JSON object." });
    }
}