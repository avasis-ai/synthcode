import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export interface SagaStep {
  name: string;
  execute: () => Promise<any>;
  compensate: (context: any) => Promise<void>;
}

export class SagaOrchestrator {
  constructor() {}

  async executeSaga(steps: SagaStep[]): Promise<any> {
    const successfulSteps: SagaStep[] = [];
    let finalContext: any = {};

    try {
      for (const step of steps) {
        try {
          console.log(`[SAGA] Executing step: ${step.name}`);
          const result = await step.execute();
          successfulSteps.push(step);
          finalContext = result;
        } catch (error) {
          console.error(`[SAGA] Step failed: ${step.name}. Initiating rollback.`);
          await this.rollback(successfulSteps, finalContext);
          throw new Error(`Saga failed at step ${step.name}: ${(error as Error).message}`);
        }
      }
      console.log("[SAGA] Saga completed successfully.");
      return finalContext;
    } catch (e) {
      throw e;
    }
  }

  private async rollback(successfulSteps: SagaStep[], context: any): Promise<void> {
    console.log("[SAGA] Starting compensation process...");
    // Iterate backward through successful steps
    for (let i = successfulSteps.length - 1; i >= 0; i--) {
      const step = successfulSteps[i];
      try {
        console.log(`[SAGA] Compensating step: ${step.name}`);
        await step.compensate(context);
      } catch (compensationError) {
        console.error(`[SAGA] CRITICAL: Failed to compensate step ${step.name}. Manual intervention required. Error:`, compensationError);
        // We continue compensating even if one step fails, to attempt maximum rollback.
      }
    }
    console.log("[SAGA] Compensation process finished.");
  }
}