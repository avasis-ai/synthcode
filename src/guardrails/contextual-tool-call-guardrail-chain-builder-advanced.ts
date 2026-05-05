import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

interface GuardrailContext {
  messages: Message[];
  toolCalls: ToolUseBlock[];
  context: Record<string, any>;
}

type GuardrailResult = {
  success: boolean;
  output: Message | null;
  errors: string[];
  contextUpdates: Record<string, any>;
};

type GuardrailBuilder = {
  build: (context: GuardrailContext) => Promise<GuardrailResult>;
};

export class ContextualToolCallGuardrailChainBuilderAdvanced {
  private guardrails: GuardrailBuilder[] = [];
  private initialContext: GuardrailContext;

  constructor(initialContext: GuardrailContext) {
    this.initialContext = initialContext;
  }

  addGuardrail(guardrail: GuardrailBuilder): this {
    this.guardrails.push(guardrail);
    return this;
  }

  /**
   * Builds and executes the chain of guardrails sequentially, allowing for conditional logic simulation.
   * @param conditionFn A function that determines if the chain should proceed to the next guardrail.
   * @returns A promise resolving to the aggregated result of the chain execution.
   */
  async buildChain(
    conditionFn: (result: GuardrailResult, context: GuardrailContext) => boolean
  ): Promise<GuardrailResult> {
    let currentContext: GuardrailContext = {
      messages: [...this.initialContext.messages],
      toolCalls: [...this.initialContext.toolCalls],
      context: { ...this.initialContext.context },
    };

    let accumulatedResult: GuardrailResult = {
      success: true,
      output: null,
      errors: [],
      contextUpdates: {},
    };

    for (let i = 0; i < this.guardrails.length; i++) {
      const guardrail = this.guardrails[i];
      
      // Check condition before executing the guardrail
      if (i > 0 && !conditionFn(accumulatedResult, currentContext)) {
        break;
      }

      try {
        const result = await guardrail.build(currentContext);
        
        // Aggregate results
        accumulatedResult.success = accumulatedResult.success && result.success;
        accumulatedResult.output = result.output || accumulatedResult.output;
        accumulatedResult.errors = [...accumulatedResult.errors, ...result.errors];
        
        // Merge context updates
        Object.assign(accumulatedResult.contextUpdates, result.contextUpdates);

        // Update context for the next iteration
        currentContext = {
          messages: [...currentContext.messages, result.output ? (result.output as Message) : null],
          toolCalls: [...currentContext.toolCalls], // Simplified: assumes tool calls are managed elsewhere or by the guardrail itself
          context: { ...currentContext.context, ...result.contextUpdates },
        };
      } catch (error) {
        accumulatedResult.success = false;
        accumulatedResult.errors.push(`Guardrail ${i} failed: ${(error as Error).message}`);
        break;
      }
    }

    return accumulatedResult;
  }
}