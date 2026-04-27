import { Guardrail } from "./guardrail";

export class ToolExecutionGuardrailChain {
  private guardrails: Guardrail[];

  constructor(guardrails: Guardrail[]) {
    this.guardrails = guardrails;
  }

  public async validate(context: { history: any[]; tool_call_id: string }, step: { type: "tool_call"; tool_name: string; input: Record<string, unknown> }): Promise<void> {
    for (const guardrail of this.guardrails) {
      const result = await guardrail.validate(context, step);
      if (!result.isValid) {
        throw new Error(`Guardrail failed: ${guardrail.name} - ${result.message}`);
      }
    }
  }
}