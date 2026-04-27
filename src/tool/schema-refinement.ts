import { Message, ToolResultMessage } from "./types";

interface SchemaRefinementInput {
  rawOutput: string;
  originalSchema: Record<string, any>;
  refinementPrompt: string;
}

export class SchemaRefiner {
  constructor(private llmClient: { call: (prompt: string, schema: Record<string, any>) => Promise<string> }) {}

  async refine(input: SchemaRefinementInput): Promise<string> {
    const { rawOutput, originalSchema, refinementPrompt } = input;

    const systemInstruction = `You are an expert data formatter. Your task is to refine the provided raw tool output based on a specific, stricter schema and a natural language refinement prompt.

    1. Analyze the raw output: "${rawOutput}"
    2. Adhere strictly to the structure defined by the target schema: ${JSON.stringify(originalSchema)}.
    3. Incorporate the user's refinement instructions: "${refinementPrompt}"

    Your final output MUST be a JSON object that validates against the provided schema. Do not include any explanatory text, markdown formatting (like \`\`\`json\`), or preamble. Output only the raw JSON object.`;

    const combinedPrompt = `Raw Output: ${rawOutput}\n\nRefinement Goal: ${refinementPrompt}`;

    try {
      const refinedJson = await this.llmClient.call(combinedPrompt, originalSchema);
      return refinedJson;
    } catch (error) {
      throw new Error(`Schema refinement failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}