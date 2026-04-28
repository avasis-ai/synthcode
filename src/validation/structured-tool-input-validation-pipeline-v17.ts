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

export interface ProjectContext {
  history: Message[];
  metadata: Record<string, unknown>;
}

export interface ToolInvocationRecord {
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  contextualIssues: string[];
};

type ValidatorStep = (
  input: Record<string, unknown>
) => {
  isValid: boolean;
  errors: string[];
};

type ContextualValidatorStep = (
  input: Record<string, unknown>
  context: ProjectContext
  history: ToolInvocationRecord[]
) => {
  isValid: boolean;
  contextualIssues: string[];
};

interface ValidationStep {
  validate: (input: Record<string, unknown>) => {
    isValid: boolean;
    errors: string[];
  };
}

export class ContextualDependencyResolverStep implements ContextualValidatorStep {
  private readonly resolverName: string;

  constructor(resolverName: string) {
    this.resolverName = resolverName;
  }

  validate(
    input: Record<string, unknown>,
    context: ProjectContext,
    history: ToolInvocationRecord[]
  ): {
    isValid: boolean;
    contextualIssues: string[];
  } {
    const issues: string[] = [];
    let isValid = true;

    // Simulate complex context checking logic
    if (context.metadata.getRequiredFlag === false && input.requiredField) {
      issues.push(
        `[${this.resolverName}] Cannot set 'requiredField' because project context metadata indicates it is disabled.`
      );
      isValid = false;
    }

    if (history.length > 0) {
      const lastTool = history[history.length - 1];
      if (lastTool.toolName === "data_fetcher" && input.dataId === undefined) {
        issues.push(
          `[${this.resolverName}] Input validation failed: 'dataId' must be provided when the last tool call was 'data_fetcher'.`
        );
        isValid = false;
      }
    }

    return {
      isValid,
      contextualIssues: issues,
    };
  }
}

export class ResolverChain {
  private resolvers: ContextualValidatorStep[] = [];

  addResolver(resolver: ContextualValidatorStep): this {
    this.resolvers.push(resolver);
    return this;
  }

  validate(
    input: Record<string, unknown>,
    context: ProjectContext,
    history: ToolInvocationRecord[]
  ): {
    isValid: boolean;
    contextualIssues: string[];
  } {
    let allIssues: string[] = [];
    let overallValid = true;

    for (const resolver of this.resolvers) {
      const result = resolver.validate(input, context, history);
      if (!result.isValid) {
        overallValid = false;
      }
      allIssues = allIssues.concat(result.contextualIssues);
    }

    return {
      isValid: overallValid,
      contextualIssues: allIssues,
    };
  }
}

export class StructuredToolInputValidationPipelineV17 {
  private readonly schemaValidators: ValidationStep[];
  private readonly resolverChain: ResolverChain;

  constructor(
    schemaValidators: ValidationStep[],
    resolverChain: ResolverChain
  ) {
    this.schemaValidators = schemaValidators;
    this.resolverChain = resolverChain;
  }

  validate(
    input: Record<string, unknown>,
    context: ProjectContext,
    history: ToolInvocationRecord[]
  ): ValidationResult {
    let allErrors: string[] = [];
    let allContextualIssues: string[] = [];
    let overallValid = true;

    // 1. Schema Validation (Basic Structure Check)
    for (const validator of this.schemaValidators) {
      const result = validator.validate(input);
      if (!result.isValid) {
        overallValid = false;
      }
      allErrors = allErrors.concat(result.errors);
    }

    // 2. Contextual Dependency Resolution
    const contextResult = this.resolverChain.validate(
      input,
      context,
      history
    );

    if (!contextResult.isValid) {
      overallValid = false;
    }
    allContextualIssues = allContextualIssues.concat(contextResult.contextualIssues);

    return {
      isValid: overallValid,
      errors: allErrors,
      contextualIssues: allContextualIssues,
    };
  }
}