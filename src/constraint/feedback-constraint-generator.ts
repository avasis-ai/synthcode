import { UserMessage, ContentBlock } from "./types";

export interface FeedbackInput {
  rawFeedback: string;
  source: "user" | "system" | "manual";
  severity: "low" | "medium" | "high";
}

export interface ConstraintPayload {
  id: string;
  type: "system_rule" | "data_format" | "behavioral";
  description: string;
  priority: number;
  actionable: boolean;
}

export interface GoalAdjustmentPayload {
  goalId: string;
  adjustment: string;
  justification: string;
}

export interface GeneratedConstraints {
  constraints: ConstraintPayload[];
  goals: GoalAdjustmentPayload[];
}

class FeedbackConstraintGenerator {
  private readonly systemSchema: Record<string, RegExp> = {
    "data_format": /^(must be|should be) (string|integer|boolean)$/i,
    "behavioral": /^(never|always) (must not|must)$/i,
  };

  constructor() {}

  private validateConstraint(constraint: ConstraintPayload): boolean {
    const schema = this.systemSchema[constraint.type];
    if (!schema) {
      return false;
    }
    // Simple validation check: ensure the description matches the expected pattern
    return schema.test(constraint.description);
  }

  private extractPayloads(feedback: FeedbackInput): {
    constraints: ConstraintPayload[];
    goals: GoalAdjustmentPayload[];
  } {
    // Mock LLM extraction process
    // In a real system, this would involve calling an LLM API with a structured prompt.
    
    let extractedConstraints: ConstraintPayload[] = [];
    let extractedGoals: GoalAdjustmentPayload[] = [];

    if (feedback.rawFeedback.includes("data format")) {
      extractedConstraints.push({
        id: "C001",
        type: "data_format",
        description: "The user ID must be an integer.",
        priority: 1,
        actionable: true,
      });
    }

    if (feedback.rawFeedback.includes("always")) {
      extractedConstraints.push({
        id: "C002",
        type: "behavioral",
        description: "The system must always confirm sensitive actions.",
        priority: 2,
        actionable: true,
      });
    }

    if (feedback.rawFeedback.includes("improve the goal")) {
      extractedGoals.push({
        goalId: "G_MAIN",
        adjustment: "Focus on user empathy in the initial response.",
        justification: "User reported feeling misunderstood.",
      });
    }

    return {
      constraints: extractedConstraints,
      goals: extractedGoals,
    };
  }

  public generate(feedback: FeedbackInput): GeneratedConstraints {
    const { constraints: rawConstraints, goals: rawGoals } = this.extractPayloads(feedback);

    const validatedConstraints: ConstraintPayload[] = [];
    for (const constraint of rawConstraints) {
      if (this.validateConstraint(constraint)) {
        validatedConstraints.push(constraint);
      }
    }

    return {
      constraints: validatedConstraints,
      goals: rawGoals,
    };
  }
}

export { FeedbackConstraintGenerator };