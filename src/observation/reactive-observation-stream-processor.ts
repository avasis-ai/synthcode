import { EventEmitter } from "events";

export type Severity = "CRITICAL" | "WARNING" | "INFO" | "DEBUG";

export interface ObservationEvent {
  source: string;
  severity: Severity;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface ObservationRules {
  /**
   * Predicate function to determine if an event should be processed.
   * @param event The incoming observation event.
   * @returns boolean
   */
  filter: (event: ObservationEvent) => boolean;
  /**
   * Function to calculate the impact score based on the event.
   * @param event The incoming observation event.
   * @returns number The calculated impact score (0.0 to 1.0).
   */
  calculateImpactScore: (event: ObservationEvent) => number;
}

export interface ReactiveContextUpdate {
  timestamp: number;
  impactScore: number;
  summary: string;
  actionsRecommended: string[];
  sourceEvents: ObservationEvent[];
}

export class ReactiveObservationStreamProcessor {
  private rules: ObservationRules;
  private eventEmitter: EventEmitter;

  constructor(rules: ObservationRules, eventEmitter: EventEmitter) {
    this.rules = rules;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Subscribes the processor to an external event stream (simulated via EventEmitter).
   * @param eventStream The stream emitter to listen on.
   */
  subscribe(eventStream: EventEmitter): void {
    eventStream.on("observation:incoming", (event: ObservationEvent) => {
      this.processStream(event);
    });
  }

  /**
   * Processes a single incoming observation event, applying rules and generating a context update.
   * @param event The observation event to process.
   */
  private processStream(event: ObservationEvent): void {
    if (!this.rules.filter(event)) {
      return;
    }

    const impactScore = this.rules.calculateImpactScore(event);
    const contextUpdate = this.aggregateUpdate(event, impactScore);

    this.eventEmitter.emit("context:update", contextUpdate);
  }

  /**
   * Aggregates the processed event into a structured ReactiveContextUpdate payload.
   * This simulates accumulating multiple events into one actionable update.
   * @param latestEvent The most recent event processed.
   * @param impactScore The calculated score for the update.
   * @returns ReactiveContextUpdate
   */
  private aggregateUpdate(latestEvent: ObservationEvent, impactScore: number): ReactiveContextUpdate {
    // In a real system, this would maintain an internal buffer/state.
    // For this implementation, we treat the single event as the primary source.

    let summary = `Observed change from ${latestEvent.source}. Severity: ${latestEvent.severity}.`;
    let actions: string[] = [];

    if (impactScore > 0.8) {
      summary = `CRITICAL IMPACT DETECTED. Immediate attention required.`;
      actions.push("Halt current plan.");
      actions.push("Require human review.");
    } else if (impactScore > 0.4) {
      summary = `Significant deviation detected. Plan adjustment recommended.`;
      actions.push("Re-evaluate next step.");
    }

    return {
      timestamp: Date.now(),
      impactScore: impactScore,
      summary: summary,
      actionsRecommended: actions,
      sourceEvents: [latestEvent],
    };
  }

  /**
   * Public method to simulate processing a batch or stream of events.
   * @param events Array of observation events.
   * @returns ReactiveContextUpdate[] Array of generated context updates.
   */
  public processStream(events: ObservationEvent[]): ReactiveContextUpdate[] {
    const updates: ReactiveContextUpdate[] = [];
    for (const event of events) {
      if (this.rules.filter(event)) {
        const impactScore = this.rules.calculateImpactScore(event);
        const contextUpdate = this.aggregateUpdate(event, impactScore);
        updates.push(contextUpdate);
      }
    }
    return updates;
  }
}