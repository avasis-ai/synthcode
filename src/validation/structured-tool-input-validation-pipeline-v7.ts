import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface SchemaConstraint {
  validate(input: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

interface SemanticConstraint extends SchemaConstraint {
  validateSemantic(
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): { isValid: boolean; errors: string[] };
}

class SemanticValidator {
  private readonly knowledgeGraph: Map<string, any>;

  constructor(knowledgeGraph: Map<string, any> = new Map()) {
    this.knowledgeGraph = knowledgeGraph;
  }

  validateSemantic(
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    // Simulate complex semantic checks using context and graph
    if (context.previous_tool_call_id && input.required_id) {
      if (String(input.required_id) !== String(context.previous_tool_call_id)) {
        errors.push(
          "Semantic Error: The required_id in the input does not match the context's previous tool call ID."
        );
        isValid = false;
      }
    }

    if (context.user_intent && typeof input.query === 'string' && !input.query.toLowerCase().includes(context.user_intent.toLowerCase())) {
      errors.push(
        `Semantic Error: Input query "${input.query}" does not appear to address the user intent: "${context.user_intent}"`
      );
      isValid = false;
    }

    return { isValid, errors };
  }
}

abstract class Validator {
  abstract validate(input: Record<string, unknown>, context: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

class SchemaValidator extends Validator {
  private readonly constraints: SchemaConstraint[];

  constructor(constraints: SchemaConstraint[]) {
    super();
    this.constraints = constraints;
  }

  validate(input: Record<string, unknown>, context: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];
    let isValid = true;

    for (const constraint of this.constraints) {
      const result = constraint.validate(input);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        isValid = false;
      }
    }

    return { isValid, errors: allErrors };
  }
}

class SemanticSchemaValidator extends Validator {
  private readonly schemaValidator: SchemaValidator;
  private readonly semanticValidator: SemanticValidator;

  constructor(
    schemaConstraints: SchemaConstraint[],
    semanticValidator: SemanticValidator
  ) {
    super();
    this.schemaValidator = new SchemaValidator(schemaConstraints);
    this.semanticValidator = semanticValidator;
  }

  validate(
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): { isValid: boolean; errors: string[] } {
    // 1. Schema Validation
    const schemaResult = this.schemaValidator.validate(input, context);
    if (!schemaResult.isValid) {
      return { isValid: false, errors: schemaResult.errors };
    }

    // 2. Semantic Validation (only if schema passes)
    const semanticResult = this.semanticValidator.validateSemantic(input, context);
    if (!semanticResult.isValid) {
      return { isValid: false, errors: semanticResult.errors };
    }

    return { isValid: true, errors: [] };
  }
}

export class StructuredToolInputValidationPipeline {
  private readonly validator: SemanticSchemaValidator;

  constructor(
    schemaConstraints: SchemaConstraint[],
    semanticValidator: SemanticValidator
  ) {
    this.validator = new SemanticSchemaValidator(schemaConstraints, semanticValidator);
  }

  validate(
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): { isValid: boolean; errors: string[] } {
    return this.validator.validate(input, context);
  }
}