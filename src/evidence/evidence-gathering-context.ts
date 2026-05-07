import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

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

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type Evidence = {
  source: string;
  payload: string;
  confidence_score: number;
  timestamp: number;
};

export type VerdictStatus = "PROVEN" | "REFUTED" | "INCONCLUSIVE";

export interface Verdict {
  confidence: number;
  status: VerdictStatus;
  reasons: string[];
}

export class EvidenceGatheringContext {
  private evidence: Evidence[] = [];
  private hypothesis: string | null = null;

  constructor() {}

  setHypothesis(hypothesis: string): void {
    this.hypothesis = hypothesis;
  }

  addEvidence(source: string, payload: string, confidence_score: number): void {
    if (confidence_score < 0 || confidence_score > 1) {
      throw new Error("Confidence score must be between 0 and 1.");
    }

    const evidence: Evidence = {
      source,
      payload,
      confidence_score,
      timestamp: Date.now(),
    };
    this.evidence.push(evidence);
  }

  getEvidence(): Evidence[] {
    return [...this.evidence];
  }

  calculateVerdict(): Verdict {
    if (!this.hypothesis) {
      return {
        confidence: 0.0,
        status: "INCONCLUSIVE",
        reasons: ["No hypothesis has been set. Cannot calculate verdict."],
      };
    }

    if (this.evidence.length === 0) {
      return {
        confidence: 0.0,
        status: "INCONCLUSIVE",
        reasons: ["No evidence has been gathered to support or refute the hypothesis."],
      };
    }

    const totalConfidence = this.evidence.reduce(
      (acc, evidence) => acc + evidence.confidence_score,
      0
    );

    const averageConfidence = totalConfidence / this.evidence.length;

    let status: VerdictStatus = "INCONCLUSIVE";
    let reasons: string[] = [];

    if (averageConfidence > 0.85) {
      status = "PROVEN";
      reasons.push("High average confidence score suggests strong support for the hypothesis.");
    } else if (averageConfidence < 0.3) {
      status = "REFUTED";
      reasons.push("Low average confidence score suggests the hypothesis is likely false.");
    } else {
      status = "INCONCLUSIVE";
      reasons.push("Evidence is mixed or insufficient to draw a strong conclusion.");
    }

    const finalVerdict: Verdict = {
      confidence: Math.min(1.0, averageConfidence * 1.1),
      status: status,
      reasons: reasons,
    };

    return finalVerdict;
  }
}

export { EvidenceGatheringContext };