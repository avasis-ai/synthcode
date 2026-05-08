import { EventEmitter } from "events";

export type Message = { role: "user" | "assistant" | "tool"; content: any };

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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface EventTrigger {
  eventName: string;
  predicate: (event: LoopEvent) => boolean;
}

export interface ReactiveState {
  name: string;
  onEnter?: (context: { history: Message[]; state: ReactiveState }) => Promise<void> | void;
  onExit?: (context: { history: Message[]; state: ReactiveState }) => Promise<void> | void;
  eventTriggers: EventTrigger[];
  // The logic that runs when the state is entered and no event is awaited.
  // This function must return a Promise that resolves when the step is complete.
  execute?: (context: { history: Message[]; state: ReactiveState }) => Promise<void> | void;
}

export type WorkflowDefinition = ReactiveState[];

export class MessageBus extends EventEmitter {
  // Mock implementation for demonstration purposes
  emit(event: LoopEvent): boolean {
    return super.emit(event);
  }
}

export class ReactiveWorkflowEngine {
  private workflow: WorkflowDefinition;
  private messageBus: MessageBus;

  constructor(workflow: WorkflowDefinition, messageBus: MessageBus) {
    this.workflow = workflow;
    this.messageBus = messageBus;
  }

  private async executeState(
    state: ReactiveState,
    context: { history: Message[]; state: ReactiveState }
  ): Promise<void> {
    if (state.onEnter) {
      await state.onEnter(context);
    }

    if (state.execute) {
      await state.execute(context);
    }
  }

  private async awaitEvent(
    state: ReactiveState,
    context: { history: Message[]; state: ReactiveState }
  ): Promise<void> {
    if (!state.eventTriggers || state.eventTriggers.length === 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      const listener = (event: LoopEvent) => {
        const matchedTrigger = state.eventTriggers.find(trigger => trigger.predicate(event));
        if (matchedTrigger) {
          this.messageBus.removeListener('event', listener);
          resolve(event);
        }
      };

      this.messageBus.on('event', listener);
      // Note: In a real system, this would handle timeouts/cancellation.
    });
  }

  public async run(initialHistory: Message[]): Promise<void> {
    let currentState: ReactiveState | null = null;
    let context: { history: Message[]; state: ReactiveState } = {
      history: [...initialHistory],
      state: null,
    };

    for (let i = 0; i < this.workflow.length; i++) {
      const nextState = this.workflow[i];

      if (currentState) {
        await currentState.onExit?.(context);
      }

      context.state = nextState;
      context.history = [...context.history];

      await this.executeState(nextState, context);

      if (nextState.eventTriggers && nextState.eventTriggers.length > 0) {
        await this.awaitEvent(nextState, context);
      }

      currentState = nextState;
    }
  }
}