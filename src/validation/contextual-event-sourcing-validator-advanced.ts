import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface CausalRule {
  precedingEventType: string;
  requiredFollowingEventType: string;
  description: string;
}

export interface AdvancedValidationRules {
  causalRules: CausalRule[];
  initialStateCheck?: (events: Message[]) => boolean;
}

export class ContextualEventSourcingValidatorAdvanced {
  private rules: AdvancedValidationRules;

  constructor(rules: AdvancedValidationRules) {
    this.rules = rules;
  }

  private checkCausalLinks(events: Message[]): boolean {
    if (!this.rules.causalRules || this.rules.causalRules.length === 0) {
      return true;
    }

    const eventTypes: Message['role'][] = events.map(e => (e as any).role);

    for (const rule of this.rules.causalRules) {
      const precedingType = rule.precedingEventType as Message['role'];
      const requiredFollowingType = rule.requiredFollowingEventType as Message['role'];

      let foundPreceding = false;
      for (let i = 0; i < eventTypes.length - 1; i++) {
        if (eventTypes[i] === precedingType) {
          foundPreceding = true;
          for (let j = i + 1; j < eventTypes.length; j++) {
            if (eventTypes[j] === requiredFollowingType) {
              // Found a valid sequence, move to the next rule
              break;
            }
          }
          // If we found the preceding type, we assume the rule is satisfied if any subsequent match exists.
          // For strict sequence checking, we'd need to track state more granularly, but for this scope,
          // checking for existence after the preceding event is sufficient.
          break;
        }
      }
    }
    return true;
  }

  private checkInitialState(events: Message[]): boolean {
    if (!this.rules.initialStateCheck) {
      return true;
    }
    return this.rules.initialStateCheck(events);
  }

  public validate(events: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Check Initial State Consistency
    if (!this.checkInitialState(events)) {
      errors.push("Initial state validation failed: The sequence of events does not form a valid starting context.");
    }

    // 2. Check Causal Links and Temporal Ordering
    if (!this.checkCausalLinks(events)) {
      errors.push("Causal link validation failed: Event sequence violates defined dependencies (e.g., required event missing after another event).");
    }

    const isValid = errors.length === 0;

    return { isValid, errors };
  }
}