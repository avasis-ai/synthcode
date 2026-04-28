import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type PreconditionStep = (context: { messages: Message[]; state: Record<string, unknown> }) => Promise<{ success: boolean; error?: string; contextUpdate?: Record<string, unknown> }>;

export interface ValidationResult {
  success: boolean;
  errors: string[];
  finalContextUpdate?: Record<string, unknown>;
}

export class ToolPreconditionValidatorChainV8 {
  private steps: PreconditionStep[];

  constructor(steps: PreconditionStep[] = []) {
    this.steps = steps;
  }

  public async validate(initialContext: { messages: Message[]; state: Record<string, unknown> }): Promise<ValidationResult> {
    let currentContext = { ...initialContext };
    const errors: string[] = [];
    let finalContextUpdate: Record<string, unknown> | undefined = undefined;

    for (const step of this.steps) {
      try {
        const result = await step(currentContext);

        if (!result.success) {
          errors.push(`Precondition failed: ${result.error || "Unknown error"}`);
          // Short-circuit on failure
          return { success: false, errors: [...errors], finalContextUpdate: undefined };
        }

        if (result.contextUpdate) {
          currentContext.state = { ...currentContext.state, ...result.contextUpdate };
          finalContextUpdate = { ...finalContextUpdate, ...result.contextUpdate };
        }
      } catch (e) {
        errors.push(`Critical failure during step execution: ${(e as Error).message}`);
        // Short-circuit on critical failure
        return { success: false, errors: [...errors], finalContextUpdate: undefined };
      }
    }

    return {
      success: true,
      errors: [],
      finalContextUpdate: finalContextUpdate || currentContext.state,
    };
  }
}