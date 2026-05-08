type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; result: ToolResultMessage };

export type FailureReport = {
  reportId: string;
  symptoms: string[];
  context: Record<string, unknown>;
  resourceUsage: {
    cpu: number;
    memory: number;
    time: number;
  };
  conflictDetails: string[];
};

export type SystemicWeakness =
  | "MissingConstraint"
  | "AmbiguousDefinition"
  | "TemporalMismatch"
  | "InsufficientResourceBudget"
  | "LogicFlowError"
  | "UnknownSystemicFailure";

export interface ImprovementSuggestion {
  weakness: SystemicWeakness;
  suggestedPolicyUpdate: string;
  confidenceScore: number;
  priority: "High" | "Medium" | "Low";
}

export class FailurePatternClassifier {
  constructor() {}

  private analyzeSymptoms(report: FailureReport): SystemicWeakness {
    const { symptoms, conflictDetails, resourceUsage } = report;

    if (symptoms.some(s => s.includes("conflict") && conflictDetails.length > 0)) {
      if (symptoms.some(s => s.includes("boundary") || s.includes("overlap"))) {
        return "MissingConstraint";
      }
      return "LogicFlowError";
    }

    if (symptoms.some(s => s.includes("undefined") || s.includes("ambiguous"))) {
      return "AmbiguousDefinition";
    }

    if (symptoms.some(s => s.includes("out of scope") || s.includes("time window"))) {
      return "TemporalMismatch";
    }

    if (resourceUsage.cpu > 0.9 || resourceUsage.memory > 0.9) {
      return "InsufficientResourceBudget";
    }

    return "UnknownSystemicFailure";
  }

  public classify(report: FailureReport): { weakness: SystemicWeakness; confidence: number } {
    const weakness = this.analyzeSymptoms(report);
    let confidence = 0.7;

    if (weakness === "MissingConstraint" && report.conflictDetails.length > 2) {
      confidence = 0.9;
    } else if (weakness === "InsufficientResourceBudget" && report.resourceUsage.cpu > 0.95) {
      confidence = 0.95;
    }

    return { weakness, confidence };
  }

  public suggestImprovement(report: FailureReport, classification: { weakness: SystemicWeakness; confidence: number }): ImprovementSuggestion {
    const { weakness, confidence } = classification;
    let suggestion: ImprovementSuggestion;

    switch (weakness) {
      case "MissingConstraint":
        suggestion = {
          weakness: "MissingConstraint",
          suggestedPolicyUpdate: "Implement a mandatory constraint rule defining the relationship between the conflicting entities (e.g., 'A must precede B').",
          confidenceScore: Math.min(0.95, confidence * 1.1),
          priority: "High",
        };
        break;
      case "AmbiguousDefinition":
        suggestion = {
          weakness: "AmbiguousDefinition",
          suggestedPolicyUpdate: "Refine the definition of the ambiguous term/concept by adding explicit boundary conditions or enumerating allowed states.",
          confidenceScore: Math.min(0.9, confidence * 0.9),
          priority: "Medium",
        };
        break;
      case "TemporalMismatch":
        suggestion = {
          weakness: "TemporalMismatch",
          suggestedPolicyUpdate: "Introduce a temporal validation layer or enforce strict ordering rules using timestamps or sequence IDs.",
          confidenceScore: Math.min(0.9, confidence * 1.0),
          priority: "High",
        };
        break;
      case "InsufficientResourceBudget":
        suggestion = {
          weakness: "InsufficientResourceBudget",
          suggestedPolicyUpdate: "Increase the allocated resource budget (CPU/Memory) or optimize the process flow to reduce peak usage.",
          confidenceScore: Math.min(0.95, confidence * 1.0),
          priority: "High",
        };
        break;
      default:
        suggestion = {
          weakness: weakness,
          suggestedPolicyUpdate: "Review the system architecture and failure context for general improvements; no specific rule change suggested.",
          confidenceScore: confidence * 0.5,
          priority: "Low",
        };
        break;
    }

    return suggestion;
  }
}

export { FailurePatternClassifier }