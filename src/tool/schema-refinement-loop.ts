import { ToolOutputSchema, ValidationResult, Context, Message } from "./types";

export class SchemaRefiner {
  private readonly llmService: {
    generateContent: (prompt: string, schema: Record<string, unknown>): Promise<string>;
  };

  constructor(llmService: {
    generateContent: (prompt: string, schema: Record<string, unknown>): Promise<string>;
  }) {
    this.llmService = llmService;
  }

  private buildPrompt(initialSchema: ToolOutputSchema, errors: ValidationResult[], context: Context): string {
    let prompt = `You are an expert JSON Schema refinement assistant. Your task is to review an existing JSON Schema for a tool's output and refine it based on provided validation errors and contextual information.

Initial Tool Output Schema:
${JSON.stringify(initialSchema, null, 2)}

---

Validation Errors Encountered:
${errors.length > 0 ? JSON.stringify(errors, null, 2) : "No specific validation errors provided."}

---

Contextual Information:
${context.description || "No additional context provided."}

Instructions:
1. Analyze the errors and context against the initial schema.
2. Determine what the schema is missing, incorrectly typed, or overly restrictive.
3. Output ONLY the complete, corrected, and refined JSON Schema object that accurately describes the expected tool output. Do not include any explanation, markdown formatting (like \`\`\`json), or surrounding text.

If the schema is already perfect given the context and errors, return the original schema verbatim.`;
    return prompt;
  }

  async refine(
    initialSchema: ToolOutputSchema,
    errors: ValidationResult[],
    context: Context
  ): Promise<ToolOutputSchema> {
    const prompt = this.buildPrompt(initialSchema, errors, context);

    try {
      const refinedJsonString = await this.llmService.generateContent(prompt, initialSchema);

      let refinedSchema: ToolOutputSchema;
      try {
        // Attempt to parse the output, assuming it should be a JSON object representing the schema
        const parsed = JSON.parse(refinedJsonString);
        if (typeof parsed === 'object' && parsed !== null) {
          refinedSchema = parsed as ToolOutputSchema;
        } else {
          throw new Error("Parsed content was not a valid object.");
        }
      } catch (e) {
        console.error("Failed to parse LLM output as JSON schema. Returning original schema.", e);
        return initialSchema;
      }

      return refinedSchema;
    } catch (error) {
      console.error("Schema refinement failed during LLM call. Returning original schema.", error);
      return initialSchema;
    }
  }
}