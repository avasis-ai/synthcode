import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ExternalStateUpdateAction = {
  action_type: "update_state";
  target_key: string;
  payload: Record<string, unknown>;
};

export type ThoughtStepPayload =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "thinking"; thinking: string }
  | ExternalStateUpdateAction;

export interface ExternalStateUpdateResult {
  success: boolean;
  message: string;
  updated_state_data: Record<string, unknown>;
}

export interface ChainingContext {
  history: Message[];
  current_state: Record<string, unknown>;
  last_external_result: ExternalStateUpdateResult | null;
}

export class StateUpdateService {
  private state: Record<string, unknown> = {};

  constructor(initialState: Record<string, unknown> = {}) {
    this.state = { ...initialState };
  }

  updateState(key: string, payload: Record<string, unknown>): ExternalStateUpdateResult {
    if (!key || typeof key !== 'string') {
      return { success: false, message: "Invalid key provided.", updated_state_data: this.state };
    }

    try {
      this.state[key] = payload;
      return {
        success: true,
        message: `Successfully updated state for key: ${key}`,
        updated_state_data: { ...this.state },
      };
    } catch (e) {
      return { success: false, message: `Failed to update state: ${(e as Error).message}`, updated_state_data: this.state };
    }
  }

  getState(): Record<string, unknown> {
    return { ...this.state };
  }
}

export class StructuredThoughtChainer {
  private stateService: StateUpdateService;

  constructor(initialContext: ChainingContext, stateService: StateUpdateService) {
    this.stateService = stateService;
  }

  private processStep(
    step: ThoughtStepPayload,
    context: ChainingContext
  ): {
    nextContext: ChainingContext;
    output: ContentBlock | null;
    actionTaken: boolean;
  } {
    let nextContext: ChainingContext = {
      history: [...context.history],
      current_state: { ...context.current_state },
      last_external_result: context.last_external_result,
    };
    let output: ContentBlock | null = null;
    let actionTaken = false;

    if (typeof step === 'object' && 'action_type' in step && step.action_type === "update_state") {
      const action = step as ExternalStateUpdateAction;
      const result = this.stateService.updateState(action.target_key, action.payload);

      nextContext.current_state = { ...this.stateService.getState() };
      nextContext.last_external_result = result;
      actionTaken = true;

      output = { type: "thinking", thinking: `[STATE UPDATE EXECUTED] ${result.message} New State: ${JSON.stringify(result.updated_state_data)}` };
    } else if (typeof step === 'object' && 'type' in step) {
      // Handle standard blocks (Text, ToolUse, Thinking)
      const block: ContentBlock = step as ContentBlock;
      output = block;
      // For non-state actions, context update is minimal, just recording the thought/tool use
      nextContext.history.push({ role: "assistant", content: [block] } as Message);
    } else {
      // Should not happen if input is validated
      return { nextContext, output: null, actionTaken: false };
    }

    return { nextContext, output, actionTaken };
  }

  processChain(
    steps: ThoughtStepPayload[],
    initialContext: ChainingContext
  ): {
    finalContext: ChainingContext;
    processedBlocks: ContentBlock[];
  } {
    let currentContext: ChainingContext = {
      history: initialContext.history,
      current_state: initialContext.current_state,
      last_external_result: initialContext.last_external_result,
    };
    const processedBlocks: ContentBlock[] = [];

    for (const step of steps) {
      const { nextContext, output, actionTaken } = this.processStep(step, currentContext);

      if (output) {
        processedBlocks.push(output);
      }

      currentContext = nextContext;
    }

    return {
      finalContext: currentContext,
      processedBlocks: processedBlocks,
    };
  }
}