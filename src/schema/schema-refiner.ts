import { Schema } from "./schema";
import { ValidationResult } from "../types";

export class SchemaRefiner {
    private readonly llmClient: {
        generateContent: (prompt: string): Promise<string>;
    };

    constructor(llmClient: {
        generateContent: (prompt: string): Promise<string>;
    }) {
        this.llmClient = llmClient;
    }

    async refine(schema: Schema, errors: ValidationResult[], examples: any[]): Promise<Schema> {
        const errorDetails = errors.map(e => `Field: ${e.field}, Message: ${e.message}`).join("\n");
        const exampleDetails = examples.length > 0 ? JSON.stringify(examples, null, 2) : "No examples provided.";

        const prompt = `You are an expert JSON Schema developer. Your task is to refine an existing JSON Schema based on validation failures and provided examples.

Initial Schema:\n${JSON.stringify(schema, null, 2)}\n
--------------------------------------------------
Validation Errors Encountered:
${errorDetails}
--------------------------------------------------
Examples Provided (if any):
${exampleDetails}
--------------------------------------------------
Based on the errors and examples, please provide a revised, complete, and valid JSON Schema that corrects the structural ambiguities. Respond ONLY with the JSON object representing the new schema, nothing else.`;

        const responseText = await this.llmClient.generateContent(prompt);

        try {
            const refinedSchema: Schema = JSON.parse(responseText);
            return refinedSchema;
        } catch (e) {
            throw new Error("Failed to parse the refined schema from the LLM response. Ensure the response is valid JSON Schema.");
        }
    }
}