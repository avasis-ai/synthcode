import { ToolInvocationContext } from "./tool-invocation-context";

export interface IInvocationGuardrail {
  validate(context: ToolInvocationContext): Promise<GuardrailResult>;
}

export interface GuardrailResult {
  isValid: boolean;
  message?: string;
}

export class ToolInvocationGuardrailChain {
  private guardrails: IInvocationGuardrail[];

  constructor(guardrails: IInvocationGuardrail[]) {
    this.guardrails = guardrails;
  }

  public async run(context: ToolInvocationContext): Promise<GuardrailResult> {
    for (const guardrail of this.guardrails) {
      const result = await guardrail.validate(context);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }
}