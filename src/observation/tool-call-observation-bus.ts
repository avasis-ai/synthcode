import { EventEmitter } from "events";

export interface ObservationEvent {
  toolName: string;
  step: string;
  severity: "INFO" | "WARNING" | "ERROR";
  data: Record<string, unknown>;
  timestamp: number;
}

export class ToolCallObservationBus {
  private static instance: ToolCallObservationBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
  }

  public static getInstance(): ToolCallObservationBus {
    if (!ToolCallObservationBus.instance) {
      ToolCallObservationBus.instance = new ToolCallObservationBus();
    }
    return ToolCallObservationBus.instance;
  }

  public publish(event: ObservationEvent): void {
    this.emitter.emit("observation", event);
  }

  public subscribe(handler: (event: ObservationEvent) => void): () => void {
    this.emitter.on("observation", handler);
    return () => this.emitter.removeListener("observation", handler);
  }
}

export { ToolCallObservationBus };