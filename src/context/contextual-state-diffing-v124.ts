import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContextualEvent {
  timestamp: number;
  eventType: "user_input" | "assistant_response" | "tool_execution" | "system_update";
  source: string;
  payload: any;
}

export interface CausalLink {
  sourceEventId: string;
  targetStateKey: string;
  causalStrength: number;
  description: string;
}

export interface StateMutation {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface CausalDiffPayload {
  mutations: StateMutation[];
  causalLinks: CausalLink[];
  temporalOrder: {
    timestamp: number;
    event: ContextualEvent;
    impactedKeys: string[];
  }[];
}

export class ContextualStateDiffer {
  private currentState: Record<string, any>;

  constructor(initialState: Record<string, any> = {}) {
    this.currentState = initialState;
  }

  private _calculateMutation(oldState: Record<string, any>, newState: Record<string, any>): {
    mutations: StateMutation[];
  } {
    const mutations: StateMutation[] = [];
    for (const key in newState) {
      if (Object.prototype.hasOwnProperty.call(newState, key) &&
        Object.prototype.hasOwnProperty.call(oldState, key) &&
        oldState[key] !== newState[key]) {
        mutations.push({
          key: key,
          oldValue: oldState[key],
          newValue: newState[key],
          timestamp: Date.now(),
        });
      }
    }
    return { mutations };
  }

  private _analyzeCausality(
    mutations: StateMutation[],
    events: ContextualEvent[]
  ): {
    causalLinks: CausalLink[];
    temporalOrder: {
      timestamp: number;
      event: ContextualEvent;
      impactedKeys: string[];
    }[];
  } {
    const causalLinks: CausalLink[] = [];
    const temporalOrder: {
      timestamp: number;
      event: ContextualEvent;
      impactedKeys: string[];
    }[] = [];

    // Simplified causal analysis: link mutations to the most recent event
    // that occurred before the mutation's timestamp.
    for (const mutation of mutations) {
      const relevantEvents = events
        .filter(event => event.timestamp < mutation.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (relevantEvents.length > 0) {
        const lastEvent = relevantEvents[0];
        causalLinks.push({
          sourceEventId: `${lastEvent.eventType}:${lastEvent.source}`,
          targetStateKey: mutation.key,
          causalStrength: 0.8, // Placeholder strength
          description: `Change in ${mutation.key} likely caused by ${lastEvent.eventType}.`,
        });
      }
    }

    // Build temporal order based on mutations and events
    const orderedImpacts = [...mutations.map(m => ({
      timestamp: m.timestamp,
      event: {
        timestamp: m.timestamp,
        eventType: "system_update",
        source: "diffing_engine",
        payload: { key: m.key }
      } as ContextualEvent,
      impactedKeys: [m.key]
    })), ...events.map(e => ({
      timestamp: e.timestamp,
      event: e,
      impactedKeys: [] // Simplification
    }))];

    orderedImpacts.sort((a, b) => a.timestamp - b.timestamp);

    return { causalLinks, temporalOrder: orderedImpacts };
  }

  public calculateCausalDiff(
    newState: Record<string, any>,
    contextualEvents: ContextualEvent[]
  ): CausalDiffPayload {
    const { mutations: mutationReport } = this._calculateMutation(
      this.currentState,
      newState
    );

    const { causalLinks, temporalOrder } = this._analyzeCausality(
      mutationReport,
      contextualEvents
    );

    return {
      mutations: mutationReport,
      causalLinks: causalLinks,
      temporalOrder: temporalOrder,
    };
  }

  public updateState(newState: Record<string, any): void {
    this.currentState = newState;
  }
}