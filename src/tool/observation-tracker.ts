import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export interface Observation {
  toolCallId: string;
  rawOutput: string;
  executionContext: Record<string, unknown>;
  timestamp: number;
}

export class ObservationTracker {
  private observations: Map<string, Observation[]> = new Map();

  recordObservation(toolCallId: string, observation: Observation): void {
    if (!this.observations.has(toolCallId)) {
      this.observations.set(toolCallId, []);
    }
    const existingObservations = this.observations.get(toolCallId)!;
    existingObservations.push(observation);
  }

  getObservationsForTool(toolCallId: string): Observation[] {
    return this.observations.get(toolCallId) || [];
  }

  getAllObservations(): Observation[] {
    let all: Observation[] = [];
    for (const [toolCallId, observations] of this.observations.entries()) {
      all = all.concat(observations);
    }
    return all;
  }
}