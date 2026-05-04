import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ExternalStateUpdateAction {
  targetSystem: string;
  payload: Record<string, unknown>;
  validationSchema: Record<string, any>;
}

export interface StateUpdateResult {
  success: boolean;
  message: string;
  updatedState: Record<string, unknown>;
}

export interface StateUpdateStep {
  executeUpdate: (action: ExternalStateUpdateAction) => Promise<StateUpdateResult>;
}

export interface StructuredThoughtChainContext {
  messages: Message[];
  currentState: Record<string, unknown>;
  history: {
    stepName: string;
    result: StateUpdateResult | { thought: string };
  }[];
}

export class StructuredThoughtChainer {
  private context: StructuredThoughtChainContext;
  private stateUpdateStep: StateUpdateStep;

  constructor(initialContext: StructuredThoughtChainContext, stateUpdateStep: StateUpdateStep) {
    this.context = initialContext;
    this.stateUpdateStep = stateUpdateStep;
  }

  private recordStep(stepName: string, result: StateUpdateResult | { thought: string }): StructuredThoughtChainContext {
    const newHistory = [...this.context.history, { stepName, result }];
    return {
      ...this.context,
      history: newHistory,
    };
  }

  public async executeStateUpdateStep(action: ExternalStateUpdateAction): Promise<StructuredThoughtChainContext> {
    try {
      const result = await this.stateUpdateStep.executeUpdate(action);
      const newContext = this.recordStep("ExternalStateUpdate", result);
      
      const thinkingBlock: ThinkingBlock = {
        type: "thinking",
        thinking: `Successfully updated external state in ${action.targetSystem}. Result: ${result.message}. New state snapshot: ${JSON.stringify(result.updatedState)}`,
      };

      const newMessages: Message[] = [
        ...this.context.messages,
        { role: "assistant", content: [thinkingBlock] }
      ];

      return {
        messages: newMessages,
        currentState: { ...this.context.currentState, ...result.updatedState },
        history: newContext.history,
      };
    } catch (error) {
      const errorResult: StateUpdateResult = {
        success: false,
        message: `Failed to update external state in ${action.targetSystem}: ${(error as Error).message}`,
        updatedState: this.context.currentState,
      };
      const newContext = this.recordStep("ExternalStateUpdate", errorResult);

      const thinkingBlock: ThinkingBlock = {
        type: "thinking",
        thinking: `CRITICAL FAILURE: Could not update external state in ${action.targetSystem}. Error: ${(error as Error).message}. Proceeding with caution.`,
      };

      const newMessages: Message[] = [
        ...this.context.messages,
        { role: "assistant", content: [thinkingBlock] }
      ];

      return {
        messages: newMessages,
        currentState: this.context.currentState,
        history: newContext.history,
      };
    }
  }

  public async executeThoughtStep(thought: string): Promise<StructuredThoughtChainContext> {
    const newHistory = [...this.context.history, { stepName: "ThoughtProcess", result: { thought } }];
    const newMessages: Message[] = [
      ...this.context.messages,
      { role: "assistant", content: [{ type: "thinking", thinking: thought }] }
    ];
    return {
      messages: newMessages,
      currentState: this.context.currentState,
      history: newHistory,
    };
  }
}