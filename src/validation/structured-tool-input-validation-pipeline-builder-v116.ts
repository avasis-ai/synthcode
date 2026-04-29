import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationStep = {
  type: "required" | "cross_field" | "temporal";
  config: any;
};

export class StructuredToolInputValidationPipelineBuilder {
  private schema: Record<string, any>;
  private steps: ValidationStep[] = [];
  private contextSchema: Record<string, any> = {};

  constructor(initialSchema: Record<string, any>) {
    this.schema = initialSchema;
  }

  addRequiredField(fieldName: string): this {
    this.steps.push({ type: "required", config: { field: fieldName } });
    return this;
  }

  addCrossFieldDependency(
    fieldA: string,
    fieldB: string,
    condition: (aValue: any, bValue: any) => boolean,
    errorMessage: string
  ): this {
    this.steps.push({ type: "cross_field", config: { fieldA, fieldB, condition, errorMessage } });
    return this;
  }

  addTemporalConstraint(
    fieldName: string,
    constraint: (value: any, history: any[]) => boolean,
    errorMessage: string
  ): this {
    this.steps.push({ type: "temporal", config: { field: fieldName, constraint, errorMessage } });
    return this;
  }

  build(): {
    steps: ValidationStep[];
    initialSchema: Record<string, any>;
  } {
    return {
      steps: [...this.steps],
      initialSchema: this.schema,
    };
  }
}