import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type StructuredSchema<T> = {
    description: string;
    schema: T;
};

export class StructuredOutputParser {
    private llmCall: (prompt: string, schema: any): Promise<string>;

    constructor(llmCall: (prompt: string, schema: any) => Promise<string>) {
        this.llmCall = llmCall;
    }

    private generateSchemaPrompt<T>(schema: T): string {
        const schemaJson = JSON.stringify(schema, null, 2);
        return `You are an expert system designed to output structured JSON based on the provided schema.
        Your output MUST be a single, valid JSON object that conforms exactly to the following schema:
        ${schemaJson}

        If the required information is not present in the context, use null or an empty array where appropriate, but always return a valid JSON object matching the structure.

        Context: ${schema.description}`;
    }

    private generateExamplePrompt<T>(schema: T): string {
        return `Based on the following context, please generate a JSON object that strictly adheres to the following structure: ${JSON.stringify(schema, null, 2)}.

        Context: [Insert relevant context here]
        `;
    }

    private attemptJsonParse(rawText: string): (obj: any) => {
        try {
            const jsonString = rawText.trim();
            if (!jsonString) {
                throw new Error("Empty string provided.");
            }
            return () => JSON.parse(jsonString);
        } catch (e) {
            return () => {
                throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`);
            };
        }
    }

    public async parseStructuredOutput<T>(
        schema: StructuredSchema<T>,
        context: string
    ): Promise<{ data: T | null, success: boolean, rawOutput: string, error: string | null }> {
        const fullPrompt = this.generateExamplePrompt<T>(schema.schema).replace("[Insert relevant context here]", context);
        const schemaPrompt = this.generateSchemaPrompt<T>(schema.schema);

        let rawOutput: string;
        try {
            // 1. Primary attempt using LLM with JSON mode instruction
            const llmPromise = this.llmCall(fullPrompt, schema.schema);
            rawOutput = await llmPromise;
        } catch (e) {
            return { data: null, success: false, rawOutput: "", error: `LLM call failed: ${e instanceof Error ? e.message : String(e)}` };
        }

        // 2. Attempt strict JSON parsing
        const jsonParser = this.attemptJsonParse(rawOutput);
        try {
            const parsedData: T = jsonParser();
            return { data: parsedData, success: true, rawOutput: rawOutput, error: null };
        } catch (e) {
            // 3. Fallback mechanism (Lenient parsing/Logging deviation)
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.warn(`[StructuredOutputParser] Primary JSON parsing failed. Attempting fallback. Error: ${errorMsg}`);

            // For this implementation, the fallback is just returning the raw text and marking failure,
            // as true "lenient" parsing requires knowing the exact structure to guide the fallback.
            // We log the deviation and return null data.
            return { data: null, success: false, rawOutput: rawOutput, error: `JSON Parsing Failed: ${errorMsg}` };
        }
    }
}