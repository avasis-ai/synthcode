import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types.js";

type ExecutionContext = {
  currentMessage: Message;
  history: Message[];
  state: any;
  toolCallId: string;
};

type State = {
  data: Record<string, any>;
  metadata: Record<string, unknown>;
};

export interface ExecutionInterceptor {
  /**
   * Called before the agent decides to call a tool.
   * @param context The current execution context.
   * @returns A modified context or the original context.
   */
  onBeforeToolCall?(context: ExecutionContext): ExecutionContext;

  /**
   * Called after a tool has been executed and results are available.
   * @param result The result of the tool execution.
   * @param context The context before processing the result.
   * @returns A modified context or the original context.
   */
  onAfterToolCall?(result: Message, context: ExecutionContext): ExecutionContext;

  /**
   * Called before the agent commits changes to the persistent state.
   * @param state The proposed state changes.
   * @returns A modified state object.
   */
  onBeforeStateCommit?(state: State): State;

  /**
   * Called after the state has been successfully committed.
   * @param newState The final, committed state.
   * @param context The context that led to the commit.
   * @returns A modified context or the original context.
   */
  onAfterStateCommit?(newState: State, context: ExecutionContext): ExecutionContext;

  /**
   * Called right before the final response is generated.
   * @param context The final context.
   * @returns A modified context or the original context.
   */
  onBeforeResponseGeneration?(context: ExecutionContext): ExecutionContext;
}

export class ExecutionInterceptorChain {
  private interceptors: ExecutionInterceptor[] = [];

  addInterceptor(interceptor: ExecutionInterceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * Executes all registered interceptors sequentially for the given stage.
   * @param stage The lifecycle stage being intercepted.
   * @param context The initial context.
   * @param data Optional data specific to the stage (e.g., tool result, state).
   * @returns The final, potentially modified context.
   */
  private executeChain(
    stage: 'beforeToolCall' | 'afterToolCall' | 'beforeStateCommit' | 'afterStateCommit' | 'beforeResponseGeneration',
    context: any,
    data?: any
  ): any {
    let currentContext = context;

    for (const interceptor of this.interceptors) {
      switch (stage) {
        case 'beforeToolCall':
          if (interceptor.onBeforeToolCall) {
            currentContext = interceptor.onBeforeToolCall(currentContext);
          }
          break;
        case 'afterToolCall':
          if (interceptor.onAfterToolCall) {
            currentContext = interceptor.onAfterToolCall(data as Message, currentContext);
          }
          break;
        case 'beforeStateCommit':
          if (interceptor.onBeforeStateCommit) {
            return interceptor.onBeforeStateCommit(data as State);
          }
          break;
        case 'afterStateCommit':
          if (interceptor.onAfterStateCommit) {
            currentContext = interceptor.onAfterStateCommit(data as State, currentContext);
          }
          break;
        case 'beforeResponseGeneration':
          if (interceptor.onBeforeResponseGeneration) {
            currentContext = interceptor.onBeforeResponseGeneration(currentContext);
          }
          break;
      }
    }
    return currentContext;
  }

  runBeforeToolCall(context: ExecutionContext): ExecutionContext {
    return this.executeChain('beforeToolCall', context);
  }

  runAfterToolCall(result: Message, context: ExecutionContext): ExecutionContext {
    return this.executeChain('afterToolCall', context, result);
  }

  runBeforeStateCommit(state: State): State {
    return this.executeChain('beforeStateCommit', null, state);
  }

  runAfterStateCommit(newState: State, context: ExecutionContext): ExecutionContext {
    return this.executeChain('afterStateCommit', context, newState);
  }

  runBeforeResponseGeneration(context: ExecutionContext): ExecutionContext {
    return this.executeChain('beforeResponseGeneration', context);
  }
}