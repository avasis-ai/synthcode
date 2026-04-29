import { EventEmitter } from "events";

export interface EventPayload {
  type: string;
  data: any;
  timestamp: number;
}

export interface EventProcessor {
  processEvent(event: EventPayload): Promise<void>;
  waitForEvent(timeoutMs: number): Promise<EventPayload | null>;
}

export class ContextualEventStreamProcessor implements EventProcessor {
  private eventEmitter: EventEmitter = new EventEmitter();
  private eventQueue: EventPayload[] = [];
  private isProcessing: boolean = false;

  constructor() {}

  public addEvent(event: EventPayload): void {
    this.eventQueue.push(event);
    this.eventEmitter.emit("new_event");
  }

  public async processEvent(event: EventPayload): Promise<void> {
    if (this.isProcessing) {
      console.warn("Processor is already busy. Queueing event.");
      this.eventQueue.push(event);
      return Promise.resolve();
    }

    this.isProcessing = true;
    console.log(`[Processor] Starting to process event: ${event.type}`);

    try {
      await this.processQueue();
    } finally {
      this.isProcessing = false;
      console.log("[Processor] Finished processing event stream.");
    }
  }

  private async processQueue(): Promise<void> {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      console.log(`[Processor] Processing queued event: ${event.type}`);
      await this.handleSingleEvent(event);
    }
  }

  private async handleSingleEvent(event: EventPayload): Promise<void> {
    switch (event.type) {
      case "CRITICAL_STATE_CHANGE":
        console.warn("[Processor] CRITICAL EVENT DETECTED. Pausing execution flow.");
        // Simulate complex state update logic
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log("[Processor] Critical state absorbed. Resuming flow.");
        break;
      case "USER_INTERRUPTION":
        console.warn("[Processor] User interruption detected. Yielding control.");
        // In a real system, this might trigger a UI prompt or context reset
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
      default:
        console.log(`[Processor] Handled standard event: ${event.type}`);
        break;
    }
  }

  public async waitForEvent(timeoutMs: number): Promise<EventPayload | null> {
    console.log(`[Processor] Waiting for event for up to ${timeoutMs}ms...`);
    const timeoutPromise = new Promise<EventPayload | null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    );

    const eventPromise = new Promise<EventPayload | null>((resolve) => {
      const listener = (event: any) => {
        const payload: EventPayload = event.detail || event;
        this.eventEmitter.once("new_event", () => {
          resolve(payload);
          this.eventEmitter.removeListener("new_event", listener);
        });
      };
      this.eventEmitter.on("new_event", listener);
    });

    return Promise.race([eventPromise, timeoutPromise]);
  }
}

export const createEventProcessor = (): ContextualEventStreamProcessor => {
  return new ContextualEventStreamProcessor();
};