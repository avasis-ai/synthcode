import { Message } from "./types.js";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warning: string | null;
}

export interface Guardrail {
  name: string;
  check(prompt: string, context: Message[]): {
    modifiedPrompt: string;
    result: ValidationResult;
  };
}

export class PromptGuardrailChain {
  private guardrails: Guardrail[];

  constructor(guardrails: Guardrail[]) {
    this.guardrails = guardrails;
  }

  public async run(initialPrompt: string, context: Message[]): Promise<{
    finalPrompt: string;
    validationResult: ValidationResult;
  }> {
    let currentPrompt = initialPrompt;
    let aggregatedResult: ValidationResult = {
      isValid: true,
      errors: [],
      warning: null,
    };

    for (const guardrail of this.guardrails) {
      const { modifiedPrompt, result } = guardrail.check(currentPrompt, context);

      // Aggregate results
      if (!result.isValid) {
        aggregatedResult.isValid = false;
        aggregatedResult.errors = [...aggregatedResult.errors, ...result.errors];
      } else if (result.warning) {
        aggregatedResult.warning = result.warning;
      }

      // Update prompt for the next guardrail
      currentPrompt = modifiedPrompt;
    }

    return {
      finalPrompt: currentPrompt,
      validationResult: aggregatedResult,
    };
  }
}

export { PromptGuardrailChain };