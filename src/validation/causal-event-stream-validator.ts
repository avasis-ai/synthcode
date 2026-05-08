import { EventEmitter } from 'node:events';

export interface CausalViolationReport {
  violationType: "Temporal" | "Causal" | "Sequence";
  violatedLink: string;
  expectedSequence: string[];
  receivedEvent: any;
  message: string;
}

export interface PlanContext {
  /**
   * Represents the current state of the plan or knowledge graph.
   * Key: Unique identifier for a step/task.
   * Value: Expected dependencies or required preceding events.
   */
  dependencies: Map<string, string[]>;

  /**
   * Retrieves the expected next step ID based on the current state.
   * @param currentStepId The ID of the step that just completed.
   * @returns The ID of the next expected step, or null if the plan is complete.
   */
  getNextExpectedStepId(currentStepId: string): string | null;

  /**
   * Checks if the incoming event type is permissible given the current context.
   * @param eventType The type of the incoming event (e.g., 'result', 'request').
   * @returns boolean
   */
  isEventPermissible(eventType: string): boolean;
}

export type Event = {
  id: string;
  type: "request" | "result" | "acknowledgement" | "unknown";
  payload: Record<string, unknown>;
  timestamp: number;
};

export class CausalEventStreamValidator {
  private context: PlanContext;

  constructor(context: PlanContext) {
    this.context = context;
  }

  /**
   * Processes an asynchronous stream of events, validating each event against the plan context.
   * @param eventStream An iterable sequence of incoming events.
   * @returns An array of CausalViolationReport for all detected violations.
   */
  public validateStream(eventStream: Iterable<Event>): CausalViolationReport[] {
    const violations: CausalViolationReport[] = [];
    let currentState: Record<string, any> = {
      lastStepId: "",
      receivedEvents: new Map<string, number>(),
    };

    for (const event of eventStream) {
      const violation = this.validateEvent(event, currentState);
      if (violation) {
        violations.push(violation);
      }
      // Update state regardless of violation for subsequent checks (unless the violation is critical)
      currentState = this.updateState(event, currentState);
    }

    return violations;
  }

  private validateEvent(event: Event, currentState: Record<string, any>): CausalViolationReport | null {
    const { type, payload } = event;

    // 1. Check general permissibility based on the plan context
    if (!this.context.isEventPermissible(type)) {
      return {
        violationType: "Sequence",
        violatedLink: `Event Type ${type}`,
        expectedSequence: ["request", "result"],
        receivedEvent: event,
        message: `Received event type '${type}' is not expected at this stage of the plan.`,
      };
    }

    // 2. Check causal dependency (e.g., result must follow request)
    if (type === "result") {
      const requiredRequestId = payload?.requestId;
      if (!requiredRequestId) {
        return {
          violationType: "Causal",
          violatedLink: "Result Dependency",
          expectedSequence: ["request"],
          receivedEvent: event,
          message: "Result event received without a corresponding request ID.",
        };
      }
      // Check if the request was actually processed/sent
      if (!currentState.receivedEvents.has(requiredRequestId)) {
        return {
          violationType: "Causal",
          violatedLink: `Request ID ${requiredRequestId}`,
          expectedSequence: ["request"],
          receivedEvent: event,
          message: `Result received for ID ${requiredRequestId}, but no preceding request was found in the stream history.`,
        };
      }
    }

    // 3. Check temporal/step dependency (e.g., must follow the last completed step)
    const expectedNextStep = this.context.getNextExpectedStepId(currentState.lastStepId);
    if (expectedNextStep && !event.payload?.stepId || event.payload.stepId !== expectedNextStep) {
        return {
            violationType: "Temporal",
            violatedLink: "Plan Flow",
            expectedSequence: [expectedNextStep],
            receivedEvent: event,
            message: `Event step ID ${event.payload?.stepId} does not match the expected next step ID: ${expectedNextStep}.`,
        };
    }

    return null;
  }

  private updateState(event: Event, currentState: Record<string, any>): Record<string, any> {
    const newState = { ...currentState };

    if (event.type === "request" && event.payload?.stepId) {
      newState.lastStepId = event.payload.stepId;
    }

    if (event.type === "result" && event.payload?.requestId) {
      const requestId = event.payload.requestId;
      const count = (currentState.receivedEvents.get(requestId) || 0) + 1;
      newState.receivedEvents.set(requestId, count);
    }

    return newState;
  }
}