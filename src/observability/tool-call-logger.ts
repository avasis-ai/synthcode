import { Message, ToolUseBlock } from "./types";

export interface ToolCallObservation {
  callId: string;
  toolName: string;
  startTime: number;
  endTime: number;
  status: "SUCCESS" | "FAILURE" | "SKIPPED";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  errorDetails?: {
    errorType: string;
    message: string;
    stack?: string;
  };
}

export class ToolCallLogger {
  private observations: ToolCallObservation[] = [];

  logObservation(observation: ToolCallObservation): void {
    this.observations.push(observation);
  }

  getObservations(): ToolCallObservation[] {
    return [...this.observations];
  }

  serializeObservations(): string {
    return JSON.stringify(this.observations, null, 2);
  }
}

export const createToolCallLogger = (): ToolCallLogger => {
  return new ToolCallLogger();
};