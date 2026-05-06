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

type GuardrailResult = {
  isValid: boolean;
  reason: string;
  context: Record<string, unknown>;
};

type GuardrailStepFunction = (
  context: {
    toolCall: {
      name: string;
      input: Record<string, unknown>;
    };
    history: Message[];
    previousResult: GuardrailResult | null;
  }
) => GuardrailResult;

interface GuardrailStep {
  execute: GuardrailStepFunction;
  condition?: (context: {
    toolCall: {
      name: string;
      input: Record<string, unknown>;
    };
    history: Message[];
    previousResult: GuardrailResult | null;
  }) => boolean;
}

type ChainContext = {
  toolCall: {
    name: string;
    input: Record<string, unknown>;
  };
  history: Message[];
  previousResult: GuardrailResult | null;
};

type GuardrailChain = {
  steps: GuardrailStep[];
  execute: (context: {
    toolCall: {
      name: string;
      input: Record<string, unknown>;
    };
    history: Message[];
  }) => GuardrailResult;
};

export class ContextualToolCallGuardrailChainBuilder {
  private steps: GuardrailStep[] = [];

  private constructor() {}

  public static getInstance(): ContextualToolCallGuardrailChainBuilder {
    if (!ContextualToolCallGuardrailChainBuilder.instance) {
      ContextualToolCallGuardrailChainBuilder.instance = new ContextualToolCallGuardrailChainBuilder();
    }
    return ContextualToolCallGuardrailChainBuilder.instance;
  }

  public addStep(step: {
    execute: GuardrailStepFunction;
    condition?: (context: {
      toolCall: {
        name: string;
        input: Record<string, unknown>;
      };
      history: Message[];
      previousResult: GuardrailResult | null;
    }) => boolean;
  }): this {
    this.steps.push({ execute: step.execute, condition: step.condition });
    return this;
  }

  public addConditionalStep(
    execute: GuardrailStepFunction,
    condition: (context: {
      toolCall: {
        name: string;
        input: Record<string, unknown>;
      };
      history: Message[];
      previousResult: GuardrailResult | null;
    }) => boolean
  ): this {
    this.addStep({ execute, condition });
    return this;
  }

  public build(): GuardrailChain {
    const steps: GuardrailStep[] = [...this.steps];
    return {
      steps: steps,
      execute: (context: {
        toolCall: {
          name: string;
          input: Record<string, unknown>;
        };
        history: Message[];
      }) => {
        let currentContext: {
          toolCall: {
            name: string;
            input: Record<string, unknown>;
          };
          history: Message[];
          previousResult: GuardrailResult | null;
        } = {
          toolCall: context.toolCall,
          history: context.history,
          previousResult: null,
        };

        for (const step of steps) {
          if (step.condition) {
            if (!step.condition(currentContext)) {
              continue;
            }
          }

          try {
            const result = step.execute(currentContext);
            currentContext.previousResult = result;
          } catch (error) {
            return {
              isValid: false,
              reason: `Guardrail execution failed: ${(error as Error).message}`,
              context: {
                toolCall: context.toolCall,
                history: context.history,
              },
            };
          }
        }

        return {
          isValid: true,
          reason: "All guardrails passed.",
          context: {
            toolCall: context.toolCall,
            history: context.history,
          },
        };
      },
    };
  }

  private static instance: ContextualToolCallGuardrailChainBuilder;
}