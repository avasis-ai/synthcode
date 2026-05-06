import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Guardrail {
  execute: (context: any, currentChainContext: Record<string, any>): Promise<{ result: any; contextUpdate: Record<string, any> }>;
}

export interface Condition {
  evaluate: (context: any, currentChainContext: Record<string, any>): boolean;
}

export type ChainContext = Record<string, any>;

export class GuardrailChainBuilder {
  private guardrails: Guardrail[] = [];
  private conditionalSteps: { condition: Condition; guardrail: Guardrail }[] = [];
  private contextType: any;

  constructor(contextType: any) {
    this.contextType = contextType;
  }

  addGuardrail(guardrail: Guardrail): this {
    this.guardrails.push(guardrail);
    return this;
  }

  addConditionalStep(condition: Condition, guardrail: Guardrail): this {
    this.conditionalSteps.push({ condition, guardrail });
    return this;
  }

  build(): {
    execute: (context: any, initialContext: ChainContext): Promise<{ finalResult: any; finalContext: ChainContext }>;
  } {
    const allSteps: {
      type: "direct" | "conditional";
      guardrail: Guardrail;
      condition?: Condition;
    }[] = [];

    this.guardrails.forEach(guardrail => {
      allSteps.push({ type: "direct", guardrail: guardrail });
    });

    this.conditionalSteps.forEach(({ condition, guardrail }) => {
      allSteps.push({ type: "conditional", guardrail, condition });
    });

    const executeChain = async (context: any, initialContext: ChainContext): Promise<{ finalResult: any; finalContext: ChainContext }> => {
      let currentContext: ChainContext = { ...initialContext };
      let lastResult: any = null;

      for (const step of allSteps) {
        let shouldExecute = true;

        if (step.type === "conditional") {
          shouldExecute = step.condition.evaluate(context, currentContext);
        }

        if (!shouldExecute) {
          continue;
        }

        try {
          const { result, contextUpdate } = await step.guardrail.execute(context, currentContext);
          lastResult = result;
          currentContext = { ...currentContext, ...contextUpdate };
        } catch (error) {
          // In a real scenario, we might handle specific error types or implement fallback logic here.
          console.error("Guardrail execution failed:", error);
          // For simplicity, we stop the chain on failure.
          break;
        }
      }

      return { finalResult: lastResult, finalContext: currentContext };
    };

    return { execute: executeChain };
  }
}