import { EventEmitter } from "events";

export type ObservationType = "tool_output" | "state_change" | "metric";

export interface Observation {
  type: ObservationType;
  payload: any;
  source: string;
  timestamp: number;
}

export class ContextualObservationStreamer extends EventEmitter {
  private readonly observationEmitter: EventEmitter;

  constructor() {
    super();
    this.observationEmitter = new EventEmitter();
  }

  public getObservationEmitter(): EventEmitter {
    return this.observationEmitter;
  }

  public emitObservation(
    type: ObservationType,
    payload: any,
    source: string = "unknown"
  ): void {
    const observation: Observation = {
      type: type,
      payload: payload,
      source: source,
      timestamp: Date.now(),
    };
    this.observationEmitter.emit("observation", observation);
  }

  public streamObservation(
    type: ObservationType,
    payload: any,
    source: string = "unknown"
  ): void {
    this.emit("observation", {
      type: type,
      payload: payload,
      source: source,
      timestamp: Date.now(),
    });
  }
}