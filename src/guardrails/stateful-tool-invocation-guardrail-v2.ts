import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ToolInvocationHistory {
  toolName: string;
  invocationCount: number;
  lastCalledStep: number;
  success: boolean;
  // Add other relevant metadata if needed, e.g., input parameters
}

export interface StatefulGuardrailRule {
  description: string;
  // Example: Tool A must be called at least once before Tool B can be called twice
  requiresPreviousTool?: {
    toolName: string;
    minCount: number;
  };
  // Example: If Tool C fails, the next N tools must be from a specific category
  onFailureSequence?: {
    triggerToolName: string;
    failureCondition: boolean; // e.g., is_error === true
    nextNSteps: number;
    allowedToolNames: string[];
  };
  // General constraint: Tool X cannot be called more than Y times in a session
  maxTotalInvocations?: {
    toolName: string;
    maxCount: number;
  };
}

export class StatefulToolInvocationGuardrailV2 {
  private history: Map<string, ToolInvocationHistory> = new Map();
  private sessionStepCount: number = 0;
  private rules: StatefulGuardrailRule[];

  constructor(rules: StatefulGuardrailRule[]) {
    this.rules = rules;
  }

  private updateHistory(toolName: string, success: boolean): void {
    if (!this.history.has(toolName)) {
      this.history.set(toolName, {
        toolName: toolName,
        invocationCount: 0,
        lastCalledStep: -1,
        success: true,
      });
    }

    const historyEntry = this.history.get(toolName)!;
    historyEntry.invocationCount += 1;
    historyEntry.lastCalledStep = this.sessionStepCount;
    historyEntry.success = success;
    this.history.set(toolName, historyEntry);
  }

  private checkRules(toolName: string, success: boolean): { isValid: boolean; reason: string } {
    this.sessionStepCount++;

    // 1. Check Max Total Invocations
    for (const rule of this.rules) {
      if (rule.maxTotalInvocations) {
        const { toolName: checkToolName, maxCount } = rule.maxTotalInvocations;
        if (checkToolName === toolName) {
          const historyEntry = this.history.get(checkToolName)!;
          if (historyEntry.invocationCount >= maxCount) {
            return { isValid: false, reason: `Tool ${checkToolName} has reached its maximum allowed invocations of ${maxCount}.` };
          }
        }
      }
    }

    // 2. Check Failure Sequence Constraints
    for (const rule of this.rules) {
      if (rule.onFailureSequence) {
        const { triggerToolName, failureCondition, nextNSteps, allowedToolNames } = rule.onFailureSequence;

        // Check if the *previous* call triggered this sequence check
        if (this.history.get(triggerToolName)?.lastCalledStep === this.sessionStepCount - 1) {
          const previousSuccess = this.history.get(triggerToolName)!.success;
          if (failureCondition && !previousSuccess) {
            // The failure condition was met by the previous call. Now check the current call.
            if (nextNSteps > 0 && this.sessionStepCount <= this.history.get(triggerToolName)!.lastCalledStep + nextNSteps) {
              if (!allowedToolNames.includes(toolName)) {
                return { isValid: false, reason: `Following a failure in ${triggerToolName}, the next ${nextNSteps} steps must use tools from: ${allowedToolNames.join(', ')}. Cannot use ${toolName}.` };
              }
            }
          }
        }
      }
    }

    // 3. Check Required Previous Tool Sequence
    for (const rule of this.rules) {
      if (rule.requiresPreviousTool) {
        const { toolName: requiredToolName, minCount } = rule.requiresPreviousTool;
        if (requiredToolName === toolName) {
          const historyEntry = this.history.get(requiredToolName);
          if (!historyEntry || historyEntry.invocationCount < minCount) {
            return { isValid: false, reason: `Tool ${toolName} requires ${requiredToolName} to have been called at least ${minCount} time(s) previously.` };
          }
        }
      }
    }

    return { isValid: true, reason: "Tool invocation is valid according to all defined rules." };
  }

  /**
   * Validates a proposed tool invocation against all configured stateful rules.
   * @param toolName The name of the tool being invoked.
   * @param success Whether the invocation is assumed to succeed for validation purposes.
   * @returns An object containing validity status and a reason message.
   */
  public validateInvocation(toolName: string, success: boolean): { isValid: boolean; reason: string } {
    const result = this.checkRules(toolName, success);
    
    // Only update history if the validation passes, or if we are explicitly tracking the state change.
    // For this implementation, we update history regardless, as the guardrail must track the attempt.
    this.updateHistory(toolName, success);
    
    return result;
  }

  public getHistory(): Map<string, ToolInvocationHistory> {
    return this.history;
  }
}