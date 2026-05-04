import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface EnrichedEvent {
  message: Message;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface ValidatorContext {
  initialState: Record<string, any>;
  targetState: Record<string, any>;
}

export interface ContextualValidator {
  validate(
    events: ReadonlyArray<EnrichedEvent>,
    context: ValidatorContext
  ): { isValid: boolean; errors: string[] };
}

export class ContextualEventSourcingValidatorV3 implements ContextualValidator {
  validate(
    events: ReadonlyArray<EnrichedEvent>,
    context: ValidatorContext
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let currentState: Record<string, any> = { ...context.initialState };

    if (!events || events.length === 0) {
      return { isValid: true, errors: [] };
    }

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventIndex = i;

      // 1. State Transition Simulation and Validation
      try {
        currentState = this.applyEventToState(currentState, event);
      } catch (e) {
        errors.push(`Event ${eventIndex} (${event.message.role}): State transition failed. ${e instanceof Error ? e.message : String(e)}`);
        // Stop processing on critical state failure
        return { isValid: false, errors };
      }

      // 2. Causal/Temporal Consistency Checks (Example: Check for required preceding events)
      if (event.message.role === "tool" && !this.hasPrerequisiteToolCall(events, eventIndex)) {
        errors.push(`Event ${eventIndex}: Tool result received without a preceding tool use request.`);
      }

      // 3. Target State Check (Optional: Check if the current state is moving towards the target)
      this.checkTargetConsistency(currentState, context.targetState, eventIndex, errors);
    }

    // Final check against the target state
    const finalStateCheck = this.checkFinalState(currentState, context.targetState);
    if (!finalStateCheck.isValid) {
      errors.push(`Final state validation failed: ${finalStateCheck.errors.join('; ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : [],
    };
  }

  private applyEventToState(currentState: Record<string, any>, event: EnrichedEvent): Record<string, any> {
    let newState = { ...currentState };

    // Example: Update user count based on messages
    if (event.message.role === "user") {
      newState.userMessageCount = (newState.userMessageCount || 0) + 1;
    } else if (event.message.role === "assistant") {
      newState.assistantMessageCount = (newState.assistantMessageCount || 0) + 1;
    }

    // Example: Simulate complex state change based on content
    if (event.message.role === "tool" && event.message.content) {
      const toolResult = JSON.parse(event.message.content);
      if (toolResult.success === false) {
        newState.lastToolFailure = true;
      }
    }

    return newState;
  }

  private hasPrerequisiteToolCall(events: ReadonlyArray<EnrichedEvent>, currentIndex: number): boolean {
    // Check if any preceding event was a tool use request
    for (let i = 0; i < currentIndex; i++) {
      const event = events[i];
      if (event.message.role === "tool" && (event.message as any).tool_use_id) {
        return true;
      }
    }
    return false;
  }

  private checkTargetConsistency(
    currentState: Record<string, any>,
    targetState: Record<string, any>,
    index: number,
    errors: string[]
  ): void {
    // Example: If the target state requires a certain count, ensure we haven't drastically overshot it.
    if (targetState.minUserMessages && currentState.userMessageCount !== undefined && currentState.userMessageCount > targetState.minUserMessages + 5) {
      errors.push(`Warning at step ${index}: User message count (${currentState.userMessageCount}) seems excessively high compared to target minimum.`);
    }
  }

  private checkFinalState(currentState: Record<string, any>, targetState: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    // Check mandatory fields in the final state
    if (targetState.requiredFinalField && !(currentState as any).finalField) {
      errors.push(`Final state is missing the required field: ${targetState.requiredFinalField}`);
      isValid = false;
    }

    // Check derived invariants
    if (targetState.mustHavePositiveInteraction && (currentState.userMessageCount || 0) + (currentState.assistantMessageCount || 0) < 1) {
      errors.push("The interaction must contain at least one user and one assistant message.");
      isValid = false;
    }

    return { isValid, errors };
  }
}