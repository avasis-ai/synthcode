import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Event {
  eventId: string;
  timestamp: number;
  source: string;
  eventType: string;
  payloadSchemaVersion: string;
  payload: any;
}

export class EventStore {
  private events: Event[] = [];

  public append(event: Omit<Event, 'eventId' | 'timestamp'>): Event {
    const newEvent: Event = {
      eventId: crypto.randomUUID(),
      timestamp: Date.now(),
      ...event,
    };
    this.events.push(newEvent);
    return newEvent;
  }

  public getEvent(eventId: string): Event | undefined {
    return this.events.find(event => event.eventId === eventId);
  }

  public getAllEvents(): ReadonlyArray<Event> {
    return [...this.events];
  }

  public reconstructState(targetEventId: string | null): any {
    let state: any = {};
    let startIndex = 0;

    if (targetEventId) {
      const targetEvent = this.getEvent(targetEventId);
      if (!targetEvent) {
        throw new Error(`Event with ID ${targetEventId} not found.`);
      }
      startIndex = this.events.findIndex(e => e.eventId === targetEventId);
      if (startIndex === -1) {
        throw new Error(`Could not find starting index for event ID ${targetEventId}.`);
      }
    }

    const relevantEvents = this.events.slice(startIndex);

    for (const event of relevantEvents) {
      // Simplified state reconstruction logic based on event type
      if (event.eventType === "USER_MESSAGE") {
        state.userMessages = state.userMessages || [];
        state.userMessages.push(event.payload as UserMessage);
      } else if (event.eventType === "ASSISTANT_RESPONSE") {
        state.assistantMessages = state.assistantMessages || [];
        state.assistantMessages.push(event.payload as AssistantMessage);
      } else if (event.eventType === "TOOL_RESULT") {
        state.toolResults = state.toolResults || [];
        state.toolResults.push(event.payload as ToolResultMessage);
      } else if (event.eventType === "CONTEXT_UPDATE") {
        // Generic context update handling
        Object.assign(state, event.payload);
      }
    }

    return state;
  }
}

export class ContextManager {
  private eventStore: EventStore;
  private currentState: any;

  constructor() {
    this.eventStore = new EventStore();
    this.currentState = {
      history: [] as Message[],
      context: {} as Record<string, unknown>,
    };
  }

  public recordEvent(source: string, eventType: string, payload: any): Event {
    const event = this.eventStore.append({
      source,
      eventType,
      payloadSchemaVersion: "1.0",
      payload: payload,
    });
    this.currentState = this.eventStore.reconstructState(event.eventId);
    return event;
  }

  public processUserMessage(message: UserMessage): Event {
    const event = this.recordEvent("USER", "USER_MESSAGE", message);
    return event;
  }

  public processAssistantResponse(message: AssistantMessage): Event {
    const event = this.recordEvent("ASSISTANT", "ASSISTANT_RESPONSE", message);
    return event;
  }

  public processToolResult(result: ToolResultMessage): Event {
    const event = this.recordEvent("TOOL", "TOOL_RESULT", result);
    return event;
  }

  public updateContext(key: string, value: any): Event {
    const payload = { [key]: value };
    const event = this.recordEvent("SYSTEM", "CONTEXT_UPDATE", payload);
    return event;
  }

  public getHistory(): Message[] {
    return this.currentState.history || [];
  }

  public getContext(): Record<string, unknown> {
    return this.currentState.context;
  }

  public replayContext(targetEventId: string | null): { state: any, events: ReadonlyArray<Event> } {
    const state = this.eventStore.reconstructState(targetEventId);
    const events = this.eventStore.getAllEvents();
    return { state, events };
  }
}

export { ContextManager, EventStore };