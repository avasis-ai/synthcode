import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type CritiqueSeverity = "minor" | "major" | "critical";

export interface CritiquePayload {
  severity: CritiqueSeverity;
  violationDetails: string;
  suggestedRemediation: string[];
}

export interface CritiqueContext {
  isCritiqueActive: boolean;
  severity: CritiqueSeverity;
  violationSummary: string;
  requiredActions: string[];
  contextMessage: string;
}

export class CritiqueLoopManager {
  private payload: CritiquePayload | null = null;

  constructor() {}

  setCritique(payload: CritiquePayload): CritiqueLoopManager {
    this.payload = payload;
    return this;
  }

  getCritiqueContext(): CritiqueContext {
    if (!this.payload) {
      return {
        isCritiqueActive: false,
        severity: "minor",
        violationSummary: "No critique provided.",
        requiredActions: [],
        contextMessage: "No structured critique context available. Proceeding normally.",
      };
    }

    const { severity, violationDetails, suggestedRemediation } = this.payload;

    const contextMessage = `[CRITIQUE ALERT: ${severity.toUpperCase()}] The previous output violated the following guideline: "${violationDetails}". Please review the suggested remediation steps and explicitly address this violation in your next output.`;

    return {
      isCritiqueActive: true,
      severity: severity,
      violationSummary: `Violation detected: ${violationDetails}`,
      requiredActions: suggestedRemediation,
      contextMessage: contextMessage,
    };
  }

  /**
   * Generates a structured prompt segment forcing the agent to acknowledge the critique.
   * @param context The generated CritiqueContext.
   * @returns A TextBlock containing the mandatory remediation instructions.
   */
  generateRemediationPrompt(context: CritiqueContext): TextBlock {
    const actionList = context.requiredActions.map((action, index) => `${index + 1}. ${action}`).join("\n");
    
    const promptText = `\n\n--- CRITIQUE MANDATE ---\n\nATTENTION: Your previous output was flagged for review. The severity is ${context.severity.toUpperCase()}. You MUST address the following violation before proceeding:\n\nViolation Summary: ${context.violationSummary}\n\nRequired Remediation Steps:\n${actionList}\n\nYour next response must explicitly acknowledge this critique, confirm understanding of the violation, and demonstrate how you have corrected the issue according to these steps.`;

    return {
      type: "text",
      text: promptText,
    };
  }

  /**
   * Clears the internal critique state, allowing the loop to continue normally.
   */
  resetCritique(): CritiqueLoopManager {
    this.payload = null;
    return this;
  }
}