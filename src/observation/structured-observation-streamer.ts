import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Observation {
  type: string;
  schema: any;
  payload: any;
  source: string;
  timestamp: number;
}

export class StructuredObservationStreamer {
  private observations: Observation[] = [];

  private validatePayload<T>(schema: T, payload: unknown): { isValid: boolean; message: string } {
    if (typeof schema !== 'object' || schema === null) {
      return { isValid: false, message: "Schema must be a non-null object." };
    }

    if (typeof payload !== 'object' || payload === null) {
      return { isValid: false, message: "Payload must be a non-null object." };
    }

    // Basic structural validation placeholder: In a real system, this would use a library like Zod or Yup.
    // For this exercise, we assume schema structure implies required keys for payload.
    const requiredKeys = Object.keys(schema).filter(key => !schema[key] && typeof schema[key] !== 'any');

    for (const key of requiredKeys) {
      if (!(key in payload)) {
        return { isValid: false, message: `Payload missing required key: ${key}` };
      }
    }

    return { isValid: true, message: "Validation successful" };
  }

  public emitObservation<T>(
    type: string,
    schema: T,
    payload: T,
    source: string
  ): { success: boolean; observation: Observation | null } {
    const validationResult = this.validatePayload(schema, payload);

    if (!validationResult.isValid) {
      console.error(`[Streamer Error] Failed to emit observation of type ${type} from ${source}: ${validationResult.message}`);
      return { success: false, observation: null };
    }

    const observation: Observation = {
      type: type,
      schema: schema,
      payload: payload,
      source: source,
      timestamp: Date.now(),
    };

    this.observations.push(observation);
    return { success: true, observation: observation };
  }

  public getObservations(): Observation[] {
    return [...this.observations];
  }

  public clearObservations(): void {
    this.observations = [];
  }
}