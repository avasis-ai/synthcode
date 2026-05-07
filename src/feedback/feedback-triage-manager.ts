import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Category = "BUG" | "CLARITY" | "SCOPE" | "PERFORMANCE" | "OTHER";

export interface FeedbackPayload {
  raw: string;
  category: Category;
  severity: Severity;
  priorityScore: number;
}

export interface AgentContext {
  currentGoal: string;
  lastToolResult: ToolResultMessage | undefined;
  history: Message[];
}

export class FeedbackTriageManager {
  private feedbackQueue: FeedbackPayload[] = [];

  constructor() {}

  private determineCategory(rawFeedback: string): Category {
    const lower = rawFeedback.toLowerCase();
    if (lower.includes("failed") || lower.includes("error") || lower.includes("bug")) {
      return "BUG";
    }
    if (lower.includes("confusing") || lower.includes("unclear") || lower.includes("how to")) {
      return "CLARITY";
    }
    if (lower.includes("too much") || lower.includes("scope creep") || lower.includes("out of scope")) {
      return "SCOPE";
    }
    if (lower.includes("slow") || lower.includes("lagging") || lower.includes("timeout")) {
      return "PERFORMANCE";
    }
    return "OTHER";
  }

  private determineSeverity(rawFeedback: string, context: AgentContext): Severity {
    const lower = rawFeedback.toLowerCase();
    if (lower.includes("critical") || lower.includes("broken") || lower.includes("cannot proceed")) {
      return "CRITICAL";
    }
    if (lower.includes("major issue") || lower.includes("fails often")) {
      return "HIGH";
    }
    if (lower.includes("minor") || lower.includes("suggestion") || lower.includes("could be better")) {
      return "MEDIUM";
    }
    return "LOW";
  }

  private calculatePriorityScore(severity: Severity, length: number, context: AgentContext): number {
    let score = 0;
    const severityMap: Record<Severity, number> = {
      "CRITICAL": 5,
      "HIGH": 3,
      "MEDIUM": 2,
      "LOW": 1,
    };
    score += severityMap[severity];

    // Boost score if context suggests a critical failure point
    if (context.lastToolResult?.is_error && severity === "CRITICAL") {
      score += 3;
    }

    // Boost score for longer, detailed feedback
    score += Math.min(Math.floor(length / 50), 3);

    return score;
  }

  triage(rawFeedback: string, context: AgentContext): FeedbackPayload {
    const category = this.determineCategory(rawFeedback);
    const severity = this.determineSeverity(rawFeedback, context);
    const priorityScore = this.calculatePriorityScore(severity, rawFeedback.length, context);

    const payload: FeedbackPayload = {
      raw: rawFeedback,
      category: category,
      severity: severity,
      priorityScore: priorityScore,
    };

    this.feedbackQueue.push(payload);
    return payload;
  }

  getPrioritizedFeedback(): FeedbackPayload[] {
    const sortedFeedback = [...this.feedbackQueue].sort((a, b) => b.priorityScore - a.priorityScore);
    return sortedFeedback;
  }

  clearFeedback() {
    this.feedbackQueue = [];
  }
}