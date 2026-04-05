import { EventEmitter } from "events";

export type Observation = {
  type: "observation";
  data: any;
};

export interface ObservationStream {
  emit(observation: Observation): void;
  on(event: "data", listener: (data: any) => void): void;
  removeAllListeners(): void;
}

export class ToolCallObservationStreamer extends EventEmitter implements ObservationStream {
  private readonly eventEmitter: EventEmitter;

  constructor() {
    super();
    this.eventEmitter = this;
  }

  emit(observation: Observation): void {
    this.emit("data", observation.data);
  }

  on(event: "data", listener: (data: any) => void): void {
    return super.on(event, listener);
  }

  removeAllListeners(): void {
    super.removeAllListeners();
  }
}

export class ToolExecutionContext {
  private readonly observationStreamer: ToolCallObservationStreamer;

  constructor(observationStreamer: ToolCallObservationStreamer) {
    this.observationStreamer = observationStreamer;
  }

  streamObservation(data: any): void {
    const observation: Observation = {
      type: "observation",
      data: data,
    };
    this.observationStreamer.emit(observation);
  }

  getStreamer(): ToolCallObservationStreamer {
    return this.observationStreamer;
  }
}

export class AgentLoop {
  private readonly context: ToolExecutionContext;

  constructor(context: ToolExecutionContext) {
    this.context = context;
  }

  processToolObservation(toolUseId: string, result: any): void {
    const observationData = {
      tool_use_id: toolUseId,
      result: result,
      timestamp: Date.now(),
    };
    this.context.streamObservation(observationData);
  }
}