import {
  Message,
  ToolResultMessage,
  UserMessage,
  AssistantMessage,
  ToolUseBlock,
} from "./types";

export interface StateUpdate {
  entity: string;
  key: string;
  value: any;
}

export interface StateTransitionRule {
  from: string;
  to: string;
  isValid: boolean;
}

export class StatefulToolInvocationGuardrail {
  private currentState: Map<string, Record<string, any>>;
  private transitionRules: Map<string, Map<string, StateTransitionRule[]>>;

  constructor(initialState: Record<string, Record<string, any>> = {}) {
    this.currentState = new Map<string, Record<string, any>>();
    for (const [entity, state] of Object.entries(initialState)) {
      this.currentState.set(entity, { ...state });
    }
    this.transitionRules = new Map();
  }

  public addTransitionRule(entity: string, fromState: string, toState: string, isValid: boolean): void {
    if (!this.transitionRules.has(entity)) {
      this.transitionRules.set(entity, new Map());
    }
    const entityRules = this.transitionRules.get(entity)!;
    if (!entityRules.has(fromState)) {
      entityRules.set(fromState, []);
    }
    entityRules.get(fromState)!.push({ from: fromState, to: toState, isValid });
  }

  private checkStateTransition(entity: string, currentState: Record<string, any>, proposedState: Record<string, any>): boolean {
    const rulesMap = this.transitionRules.get(entity);
    if (!rulesMap) {
      return true;
    }

    const currentStatus = currentState[Object.keys(currentState).pop()!] || "unknown";
    const proposedStatus = proposedState.status || "unknown";

    const rulesForFrom = rulesMap.get(currentStatus);
    if (!rulesForFrom) {
      return true;
    }

    const validTransitions = rulesForFrom.filter(rule => rule.to === proposedStatus);
    if (validTransitions.length === 0) {
      return false;
    }

    const allValid = validTransitions.every(rule => rule.isValid);
    return allValid;
  }

  public async validateToolResult(
    toolResult: ToolResultMessage,
    stateUpdate: StateUpdate[]
  ): Promise<{ isValid: boolean; newState: Record<string, any> }> {
    if (!stateUpdate || stateUpdate.length === 0) {
      return { isValid: true, newState: this.currentState.get("global") || {} };
    }

    let proposedState: Record<string, any> = {};
    let tempState: Map<string, Record<string, any>> = new Map(this.currentState);

    for (const update of stateUpdate) {
      const entity = update.entity;
      const key = update.key;
      const value = update.value;

      if (!tempState.has(entity)) {
        tempState.set(entity, {});
      }

      const currentEntityState = tempState.get(entity)!;
      const previousValue = currentEntityState[key];

      // Simulate state change for validation purposes
      const proposedEntityState: Record<string, any> = { ...currentEntityState, [key]: value };
      
      // Simplified status check for demonstration: assume 'status' is the key being updated
      const simulatedStatusUpdate = { status: value };
      const isValidTransition = this.checkStateTransition(entity, currentEntityState, simulatedStatusUpdate);

      if (!isValidTransition) {
        return { isValid: false, newState: this.currentState.get("global") || {} };
      }

      // Apply change to temporary state
      tempState.get(entity)![key] = value;
    }

    // Update internal state only if all validations pass
    for (const [entity, state] of tempState) {
      this.currentState.set(entity, state);
    }

    return { isValid: true, newState: this.currentState.get("global") || {} };
  }
}