import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface CausalMetadata {
  causalId: string;
  timestamp: number;
}

export interface EnrichedEvent<T extends Message> extends T {
  metadata: CausalMetadata;
}

export interface ValidationReport {
  isValid: boolean;
  violations: {
    event: Message;
    reason: "Causal ID conflict" | "Temporal violation" | "Unknown violation";
    details: string;
  }[];
}

export class ContextualEventSourcingValidator {
  private processedCausalIds: Set<string>;
  private lastTimestamp: number;

  constructor() {
    this.processedCausalIds = new Set<string>();
    this.lastTimestamp = -Infinity;
  }

  private validateSingleEvent(event: EnrichedEvent<any>): { isValid: boolean; violation: { event: Message; reason: "Causal ID conflict" | "Temporal violation" | "Unknown violation"; details: string } | null } {
    const { metadata } = event;
    const message = event as Message;

    // 1. Causal ID Check
    if (this.processedCausalIds.has(metadata.causalId)) {
      return {
        isValid: false,
        violation: {
          event: message,
          reason: "Causal ID conflict",
          details: `Causal ID '${metadata.causalId}' has already been processed.`,
        },
      };
    }

    // 2. Temporal Check
    if (metadata.timestamp < this.lastTimestamp) {
      return {
        isValid: false,
        violation: {
          event: message,
          reason: "Temporal violation",
          details: `Timestamp ${metadata.timestamp} is before the last processed timestamp ${this.lastTimestamp}.`,
        },
      };
    }

    return { isValid: true, violation: null };
  }

  public validateBatch(events: Array<EnrichedEvent<any>>): ValidationReport {
    this.processedCausalIds.clear();
    this.lastTimestamp = -Infinity;
    const violations: Array<{ event: Message; reason: "Causal ID conflict" | "Temporal violation" | "Unknown violation"; details: string }> = [];

    for (const event of events) {
      const { isValid, violation } = this.validateSingleEvent(event);
      if (!isValid) {
        violations.push(violation!);
      } else {
        // Update state only if the event is valid
        this.processedCausalIds.add(event.metadata.causalId);
        this.lastTimestamp = event.metadata.timestamp;
      }
    }

    return {
      isValid: violations.length === 0,
      violations: violations,
    };
  }
}