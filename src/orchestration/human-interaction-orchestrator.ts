import { EventEmitter } from "node:events";

type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

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

export type LoopEvent = any;

export interface InteractionStep {
  stepId: string;
  prompt: string;
  requiredInputType: "text" | "boolean" | "selection";
  validationRules: (input: any) => boolean;
  description: string;
}

export class HumanInteractionOrchestrator extends EventEmitter {
  private currentStepIndex: number = -1;
  private steps: InteractionStep[] = [];
  private isAwaitingInput: boolean = false;

  constructor() {
    super();
  }

  public setSteps(steps: InteractionStep[]): void {
    this.steps = steps;
    this.currentStepIndex = -1;
  }

  public async startInteraction(): Promise<void> {
    if (this.steps.length === 0) {
      throw new Error("Interaction steps must be set before starting.");
    }
    this.currentStepIndex = -1;
    this.emit("interactionStarted");
  }

  public async awaitConfirmation(
    context: Record<string, unknown>
  ): Promise<{ success: boolean; input: any }> {
    if (this.steps.length === 0) {
      throw new Error("Interaction steps must be set.");
    }

    if (this.currentStepIndex === -1) {
      await this.startInteraction();
    }

    const step = this.steps[this.currentStepIndex];
    if (!step) {
      throw new Error("Interaction sequence finished or invalid state.");
    }

    this.isAwaitingInput = true;
    this.emit("awaitingInput", { step, context });

    const input = await this.waitForExternalInput(step);

    if (!step.validationRules(input)) {
      this.emit("inputValidationFailed", { step, input });
      return { success: false, input: input };
    }

    this.currentStepIndex++;
    this.emit("inputReceived", { step, input, context });

    this.isAwaitingInput = false;
    return { success: true, input };
  }

  private async waitForExternalInput(step: InteractionStep): Promise<any> {
    return new Promise((resolve) => {
      // In a real environment, this would pause execution (e.g., using a dedicated event loop hook or stream wait).
      // For simulation, we rely on the event emitter pattern.
      const listener = (data: { input: any }) => {
        resolve(data.input);
        this.removeListener("externalInput", listener);
      };

      this.once("externalInput", listener);
      console.log(`[Orchestrator] Paused execution. Awaiting input for step: ${step.stepId}`);
    });
  }

  public getNextStep(): InteractionStep | undefined {
    if (this.currentStepIndex < this.steps.length - 1) {
      return this.steps[this.currentStepIndex + 1];
    }
    return undefined;
  }
}

export { HumanInteractionOrchestrator };