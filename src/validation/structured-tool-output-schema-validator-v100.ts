import {
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ToolOutput = {
  primary_result: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  blocks: ContentBlock[];
};

type SchemaDefinition = Record<string, any>;
type ValidatorStep = (output: ToolOutput) => { isValid: boolean; errors: string[] };

export class StructuredOutputSchemaValidator {
  private schema: SchemaDefinition;
  private validationSteps: ValidatorStep[] = [];

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  withCrossFieldCheck(validator: ValidatorStep): this {
    this.validationSteps.push(validator);
    return this;
  }

  private validateSchema(output: ToolOutput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    // Basic schema validation placeholder (simplified for this context)
    if (typeof output.primary_result !== "object" || output.primary_result === null) {
      errors.push("Primary result must be a non-null object.");
      isValid = false;
    }

    if (output.metadata && typeof output.metadata !== "object") {
      errors.push("Metadata must be an object.");
      isValid = false;
    }

    return { isValid, errors };
  }

  private validateBlocks(output: ToolOutput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    for (let i = 0; i < output.blocks.length; i++) {
      const block = output.blocks[i];
      switch (block.type) {
        case "text":
          if (typeof block.text !== "string" || block.text.length === 0) {
            errors.push(`Block ${i}: Text block requires non-empty string content.`);
            isValid = false;
          }
          break;
        case "tool_use":
          if (!block.id || !block.name || typeof block.input !== "object") {
            errors.push(`Block ${i}: ToolUse block requires id, name, and input object.`);
            isValid = false;
          }
          break;
        case "thinking":
          if (typeof block.thinking !== "string" || block.thinking.length === 0) {
            errors.push(`Block ${i}: Thinking block requires non-empty string content.`);
            isValid = false;
          }
          break;
        default:
          errors.push(`Block ${i}: Unknown block type encountered.`);
          isValid = false;
      }
    }
    return { isValid, errors };
  }

  public validate(output: ToolOutput): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];
    let overallValid = true;

    // 1. Schema Validation
    const schemaResult = this.validateSchema(output);
    allErrors.push(...schemaResult.errors);
    if (!schemaResult.isValid) {
      overallValid = false;
    }

    // 2. Block Content Validation
    const blockResult = this.validateBlocks(output);
    allErrors.push(...blockResult.errors);
    if (!blockResult.isValid) {
      overallValid = false;
    }

    // 3. Cross-Field/Custom Validation Steps
    for (const step of this.validationSteps) {
      const stepResult = step(output);
      if (!stepResult.isValid) {
        allErrors.push(...stepResult.errors);
        overallValid = false;
      }
    }

    return { isValid: overallValid, errors: allErrors };
  }
}