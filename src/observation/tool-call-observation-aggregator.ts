import { Message, ToolResultMessage } from "./types";

export interface Observation {
  source: string;
  timestamp: number;
  payload: any;
}

export class ToolCallObservationAggregator {
  private observations: Observation[] = [];

  addObservation(source: string, payload: any): void {
    const observation: Observation = {
      source,
      timestamp: Date.now(),
      payload,
    };
    this.observations.push(observation);
  }

  addToolResultMessage(message: ToolResultMessage): void {
    const source = `tool:${message.tool_use_id}`;
    const payload: any = {
      content: message.content,
      is_error: message.is_error ?? false,
    };
    this.addObservation(source, payload);
  }

  getObservations(): Readonly<Observation[]> {
    return this.observations;
  }

  getObservationsInOrder(): Readonly<Observation[]> {
    return [...this.observations];
  }

  getErrors(): Readonly<Observation[]> {
    return this.observations.filter(obs => {
      const payload = obs.payload;
      return typeof payload === 'object' && payload !== null && 'is_error' in payload && (payload as any).is_error === true;
    });
  }

  getObservationsFromTool(toolId: string): Readonly<Observation[]> {
    return this.observations.filter(obs => {
      const source = obs.source;
      return typeof source === 'string' && source.startsWith(`tool:${toolId}`);
    });
  }

  summarizeObservations(criteria: { type: 'error' | 'all' | 'tool' | 'none'; toolId?: string } = { type: 'all' }): Observation[] {
    let filteredObservations: Observation[] = [];

    if (criteria.type === 'error') {
      filteredObservations = this.getErrors();
    } else if (criteria.type === 'tool' && criteria.toolId) {
      filteredObservations = this.getObservationsFromTool(criteria.toolId);
    } else if (criteria.type === 'all') {
      filteredObservations = [...this.observations];
    } else {
      filteredObservations = [];
    }

    return filteredObservations;
  }
}