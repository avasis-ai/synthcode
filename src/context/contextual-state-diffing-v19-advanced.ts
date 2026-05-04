import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface CausalContext {
  causal_path: string[];
  temporal_window_start: number;
  temporal_window_end: number;
  source_event_id: string;
}

export interface DiffMetadata {
  causal_link: string;
  temporal_relevance: {
    start: number;
    end: number;
  };
}

export interface StateDiff<T> {
  diff: Partial<T>;
  metadata: Record<string, DiffMetadata>;
}

export class ContextualStateDiffingV19Advanced<T extends Record<string, any>> {
  private readonly previousState: T;
  private readonly currentState: T;
  private readonly context: CausalContext;

  constructor(previousState: T, currentState: T, context: CausalContext) {
    this.previousState = previousState;
    this.currentState = currentState;
    this.context = context;
  }

  private compareValues(
    prev: any,
    current: any,
    path: string,
    metadata: Record<string, DiffMetadata>
  ): { diff: any; metadata: Record<string, DiffMetadata> } {
    if (prev === current) {
      return { diff: undefined, metadata: {} };
    }

    const newMetadata: Record<string, DiffMetadata> = {
      [path]: {
        causal_link: `Contextual change via ${this.context.source_event_id}`,
        temporal_relevance: {
          start: this.context.temporal_window_start,
          end: this.context.temporal_window_end,
        },
      },
    };

    return { diff: current, metadata: newMetadata };
  }

  private compareObjects(
    prev: Record<string, any>,
    current: Record<string, any>,
    path: string,
    metadata: Record<string, DiffMetadata>
  ): { diff: Partial<Record<string, any>>; metadata: Record<string, DiffMetadata> } {
    const diff: Partial<Record<string, any>> = {};
    const newMetadata: Record<string, DiffMetadata> = {};

    for (const key in current) {
      if (!Object.prototype.hasOwnProperty.call(current, key)) continue;

      const currentVal = current[key];
      const prevVal = prev[key];
      const newPath = `${path}.${key}`;

      if (typeof currentVal === 'object' && currentVal !== null && typeof prevVal === 'object' && prevVal !== null) {
        const result = this.compareObjects(
          prevVal,
          currentVal,
          newPath,
          metadata
        );
        diff[key] = result.diff;
        Object.assign(newMetadata, result.metadata);
      } else if (typeof currentVal === 'object' && currentVal !== null && typeof prevVal !== 'object' || typeof currentVal !== 'object' && currentVal !== null && typeof prevVal === 'object') {
        // Type change detected
        const result = this.compareValues(prevVal, currentVal, newPath, metadata);
        diff[key] = result.diff;
        Object.assign(newMetadata, result.metadata);
      } else {
        const result = this.compareValues(prevVal, currentVal, newPath, metadata);
        if (result.diff !== undefined) {
          diff[key] = result.diff;
          Object.assign(newMetadata, result.metadata);
        }
      }
    }
    return { diff: diff, metadata: newMetadata };
  }

  public diffState(): StateDiff<T> {
    const { diff: diffState, metadata: diffMetadata } = this.compareObjects(
      this.previousState,
      this.currentState,
      "root",
      {}
    );

    return {
      diff: diffState,
      metadata: diffMetadata,
    };
  }
}