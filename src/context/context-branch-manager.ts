import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface ContextState {
  messages: Message[];
  // Add other state variables here if necessary, e.g., tool_outputs: Record<string, any>;
  [key: string]: any;
}

export class ContextBranchManager {
  private primaryContext: ContextState;

  constructor(initialContext: ContextState) {
    this.primaryContext = this.deepCloneContext(initialContext);
  }

  private deepCloneContext(context: ContextState): ContextState {
    const clone: ContextState = {
      messages: context.messages ? context.messages.map(msg => {
        if (typeof msg === 'object' && msg !== null) {
          return JSON.parse(JSON.stringify(msg));
        }
        return msg;
      }) : [],
    };
    // Simple shallow copy for other properties, assuming they are primitives or simple objects
    Object.keys(context).forEach(key => {
      if (key !== 'messages') {
        clone[key] = typeof context[key] === 'object' && context[key] !== null ? JSON.parse(JSON.stringify(context[key])) : context[key];
      }
    });
    return clone;
  }

  /**
   * Creates an isolated, mutable copy of the current context state.
   * @returns {ContextState} The isolated context.
   */
  public forkContext(): ContextState {
    return this.deepCloneContext(this.primaryContext);
  }

  /**
   * Executes a sequence of operations (the branch logic) against an isolated context.
   * The provided function must take the isolated context and return the modified context.
   * @param branchLogic A function that performs the execution steps.
   * @returns {ContextState} The resulting state after execution.
   */
  public executeInBranch<T>(branchLogic: (context: ContextState) => Promise<ContextState>): Promise<ContextState> {
    const isolatedContext = this.forkContext();

    return branchLogic(isolatedContext).then(result => {
      if (typeof result !== 'object' || result === null) {
        throw new Error("Branch logic must return a ContextState object.");
      }
      return result;
    });
  }

  /**
   * Merges the final state from the branch back into the primary context.
   * Implements a Last-Write-Wins strategy for messages.
   * @param branchContext The final context state from the branch.
   * @returns {ContextState} The updated primary context.
   */
  public mergeContext(branchContext: ContextState): ContextState {
    const mergedContext: ContextState = {
      ...this.primaryContext,
      messages: this.mergeMessages(this.primaryContext.messages, branchContext.messages),
    };
    return mergedContext;
  }

  private mergeMessages(primary: Message[], branch: Message[]): Message[] {
    // Simple Last-Write-Wins strategy: append all messages from the branch.
    // In a real scenario, conflict resolution (e.g., merging tool outputs) would be needed.
    return [...primary, ...branch];
  }

  /**
   * Retrieves the current, primary context state.
   */
  public getPrimaryContext(): ContextState {
    return this.deepCloneContext(this.primaryContext);
  }
}