import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

type ContentBlock = {
  type: "text";
  text: string;
} | {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
} | {
  type: "thinking";
  thinking: string;
};

type SequenceEvent = {
  type: "USER_INPUT";
  source: UserMessage;
} | {
  type: "THOUGHT_STEP";
  source: { type: "thinking"; thinking: string };
} | {
  type: "TOOL_CALL";
  source: { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
} | {
  type: "OBSERVATION";
  source: ToolResultMessage;
};

export interface SequenceDriftReport {
  deviationScore: number;
  isDrifting: boolean;
  anomalousSteps: {
    index: number;
    event: SequenceEvent;
    reason: string;
  }[];
}

export class InteractionSequenceDriftDetector {
  private readonly normalTransitionMatrix: Map<SequenceEvent['type'], Map<SequenceEvent['type'], number>>;
  private readonly history: SequenceEvent[] = [];

  constructor() {
    this.normalTransitionMatrix = this.initializeNormalTransitions();
  }

  private initializeNormalTransitions(): Map<SequenceEvent['type'], Map<SequenceEvent['type'], number>> {
    // Simplified model: Defines expected transitions (e.g., THOUGHT -> TOOL_CALL is high probability)
    const matrix = new Map<SequenceEvent['type'], Map<SequenceEvent['type'], number>>();

    // From USER_INPUT
    matrix.set("USER_INPUT", new Map([
      ["THOUGHT_STEP", 0.8],
      ["TOOL_CALL", 0.1],
    ]));

    // From THOUGHT_STEP
    matrix.set("THOUGHT_STEP", new Map([
      ["TOOL_CALL", 0.9],
      ["OBSERVATION", 0.05],
      ["THOUGHT_STEP", 0.1], // Self-correction/refinement
    ]));

    // From TOOL_CALL
    matrix.set("TOOL_CALL", new Map([
      ["OBSERVATION", 0.95],
      ["THOUGHT_STEP", 0.05],
    ]));

    // From OBSERVATION
    matrix.set("OBSERVATION", new Map([
      ["THOUGHT_STEP", 0.8],
      ["TOOL_CALL", 0.1],
    ]));

    return matrix;
  }

  private mapMessageToEvent(message: Message): SequenceEvent | null {
    if (message.role === "user") {
      return {
        type: "USER_INPUT",
        source: {
          role: "user",
          content: message.content,
        },
      };
    } else if (message.role === "assistant") {
      const thinkingBlock = message.content.find(
        (block) => (block as any).type === "thinking"
      );
      if (thinkingBlock) {
        return {
          type: "THOUGHT_STEP",
          source: thinkingBlock as { type: "thinking"; thinking: string },
        };
      }
      // Handle tool calls embedded in assistant message
      const toolUseBlock = message.content.find(
        (block) => (block as any).type === "tool_use"
      );
      if (toolUseBlock) {
        return {
          type: "TOOL_CALL",
          source: toolUseBlock as { type: "tool_use"; id: string; name: string; input: Record<string, unknown> },
        };
      }
    } else if (message.role === "tool") {
      return {
        type: "OBSERVATION",
        source: message as ToolResultMessage,
      };
    }
    return null;
  }

  /**
   * Processes a list of messages and updates the internal sequence history.
   * @param messages The sequence of messages to process.
   * @returns The updated history length.
   */
  public processSequence(messages: Message[]): number {
    for (const message of messages) {
      const event = this.mapMessageToEvent(message);
      if (event) {
        this.history.push(event);
      }
    }
    return this.history.length;
  }

  /**
   * Calculates the drift score by analyzing transitions in the current sequence
   * against the learned normal transition matrix.
   * @returns A SequenceDriftReport detailing the deviation.
   */
  public calculateDriftScore(): SequenceDriftReport {
    if (this.history.length < 2) {
      return {
        deviationScore: 0.0,
        isDrifting: false,
        anomalousSteps: [],
      };
    }

    let totalDeviation = 0;
    const anomalousSteps: {
      index: number;
      event: SequenceEvent;
      reason: string;
    }[] = [];

    for (let i = 1; i < this.history.length; i++) {
      const previousEvent = this.history[i - 1];
      const currentEvent = this.history[i];
      const previousType = previousEvent.type;
      const currentType = currentEvent.type;

      const transitions = this.normalTransitionMatrix.get(previousType);
      if (!transitions) {
        // Should not happen if types are exhaustive
        continue;
      }

      const expectedProbability = transitions.get(currentType);
      const deviation = expectedProbability !== undefined ? (1.0 - expectedProbability) : 1.0;

      // We accumulate deviation based on how unlikely the transition is.
      totalDeviation += deviation;

      // Flag the current step if the transition probability is low (e.g., < 0.2)
      if (expectedProbability === undefined || expectedProbability < 0.2) {
        anomalousSteps.push({
          index: i,
          event: currentEvent,
          reason: `Unexpected transition from ${previousType} to ${currentType}. Expected probability was ${expectedProbability ? expectedProbability.toFixed(2) : 'N/A'}.`,
        });
      }
    }

    // Normalize score: A higher score means higher deviation.
    // Max possible score is roughly history.length - 1.
    const normalizedScore = Math.min(totalDeviation / (this.history.length - 1), 1.0);

    return {
      deviationScore: parseFloat(normalizedScore.toFixed(4)),
      isDrifting: normalizedScore > 0.4, // Threshold for drift
      anomalousSteps,
    };
  }

  /**
   * Clears the internal history buffer.
   */
  public reset() {
    this.history.length = 0;
  }
}