import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationStep = (context: { input: unknown; state: Record<string, unknown> }) => { result: unknown; nextContext: { input: unknown; state: Record<string, unknown> } };
type ContextEnricher = (context: { input: unknown; state: Record<string, unknown> }) => { enrichedContext: { input: unknown; state: Record<string, unknown> } };

interface PipelineStep {
  validator: ValidationStep;
  condition?: (context: { input: unknown; state: Record<string, unknown> }) => boolean;
  enricher?: ContextEnricher;
}

export class StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced {
  private steps: PipelineStep[] = [];
  private initialContext: { input: unknown; state: Record<string, unknown> } = { input: undefined, state: {} };

  private constructor() {}

  private static getInstance(): StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced {
    if (!StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced.instance) {
      StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced.instance = new StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced();
    }
    return StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced.instance;
  }

  public static getInstance(): StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced {
    return StructuredToolOutputValidationPipelineBuilderAdvancedAdvanced.getInstance();
  }

  public addValidationStep(validator: ValidationStep, condition?: (context: { input: unknown; state: Record<string, unknown> }) => boolean): this {
    this.steps.push({ validator, condition });
    return this;
  }

  public addConditionalValidationStep(validator: ValidationStep, condition: (context: { input: unknown; state: Record<string, unknown> }) => boolean): this {
    this.steps.push({ validator, condition });
    return this;
  }

  public addContextEnricher(enricher: ContextEnricher): this {
    this.steps.push({ validator: (context) => { throw new Error("Enricher step should not be called as a validator."); }, enricher });
    return this;
  }

  public addSequentialContextEnricher(enricher: ContextEnricher): this {
    this.steps.push({ validator: (context) => ({ result: context.input, nextContext: { input: context.input, state: context.state } }), enricher });
    return this;
  }

  public build(): {
    execute: (initialInput: unknown) => { result: unknown; finalContext: { input: unknown; state: Record<string, unknown> } };
    steps: PipelineStep[];
  } {
    const execute = (initialInput: unknown): { result: unknown; finalContext: { input: unknown; state: Record<string, unknown> } } => {
      let currentContext: { input: unknown; state: Record<string, unknown> } = { input: initialInput, state: { ...this.initialContext.state } };
      let lastResult: unknown = initialInput;

      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];

        if (step.condition && !step.condition(currentContext)) {
          continue;
        }

        let contextBeforeStep = { input: currentContext.input, state: { ...currentContext.state } };

        if (step.enricher) {
          const enriched = step.enricher(contextBeforeStep);
          currentContext = { input: enriched.enrichedContext.input, state: { ...enriched.enrichedContext.state } };
          contextBeforeStep = { input: currentContext.input, state: { ...currentContext.state } };
        }

        let stepResult: unknown;
        try {
          stepResult = step.validator(contextBeforeStep);
          currentContext = { input: stepResult.nextContext.input, state: { ...stepResult.nextContext.state } };
          lastResult = stepResult.result;
        } catch (e) {
          console.error(`Validation failed at step ${i}:`, e);
          return { result: null, finalContext: { input: undefined, state: currentContext.state } };
        }
      }

      return { result: lastResult, finalContext: { input: undefined, state: currentContext.state } };
    };

    return {
      execute,
      steps: this.steps,
    };
  }
}