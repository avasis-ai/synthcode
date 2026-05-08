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

export interface SimulationContext {
  messages: Message[];
  currentPlan: string;
}

export interface ConflictAssumption {
  vector: string;
  assumption: string;
  conflict: string;
}

export interface ConflictImpact {
  assumption: string;
  deviation: string;
  mitigationSuggestion: string;
}

export interface AssumptionConflictReport {
  threatModel: string[];
  conflicts: ConflictAssumption[];
  impacts: ConflictImpact[];
  overallRobustnessScore: number;
  summary: string;
}

class AssumptionConflictSimulator {
  constructor() {}

  private generateConflictAssumptions(threatVectors: string[]): ConflictAssumption[] {
    return threatVectors.map(vector => {
      let assumption: string;
      let conflict: string;

      switch (vector) {
        case "API_FAILURE":
          assumption = "External APIs are stable and available.";
          conflict = "A critical external API is experiencing intermittent or total failure.";
          break;
        case "MISLEADING_INPUT":
          assumption = "User input accurately reflects true intent.";
          conflict = "User input is ambiguous, incomplete, or intentionally misleading.";
          break;
        case "RESOURCE_SCARCITY":
          assumption = "Required resources (data, compute, budget) are readily available.";
          conflict = "A key resource is unexpectedly scarce or rate-limited.";
          break;
        default:
          assumption = `Default assumption for ${vector}.`;
          conflict = `Default conflict for ${vector}.`;
      }

      return {
        vector: vector,
        assumption: assumption,
        conflict: conflict,
      };
    });
  }

  private simulateImpact(context: SimulationContext, conflictAssumption: ConflictAssumption): ConflictImpact {
    const { currentPlan } = context;
    const { conflict } = conflictAssumption;

    let deviation = `The plan relies on the assumption: "${conflictAssumption.assumption}". When faced with "${conflict}", the execution path breaks down.`;
    let mitigationSuggestion = "Review the plan for fallback mechanisms or alternative data sources.";

    if (conflict.includes("API failure")) {
      deviation += " Specifically, the planned API calls will fail, halting the process.";
      mitigationSuggestion = "Implement circuit breakers and use cached data or manual fallback steps.";
    } else if (conflict.includes("misleading input")) {
      deviation += " The interpretation of the user's goal will be flawed, leading to incorrect output.";
      mitigationSuggestion = "Introduce explicit clarification steps or confidence scoring on input interpretation.";
    }

    return {
      assumption: conflictAssumption.assumption,
      deviation: deviation,
      mitigationSuggestion: mitigationSuggestion,
    };
  }

  public simulate(context: SimulationContext, threatVectors: string[]): AssumptionConflictReport {
    const conflicts = this.generateConflictAssumptions(threatVectors);
    const impacts: ConflictImpact[] = [];

    for (const conflict of conflicts) {
      const impact = this.simulateImpact(context, conflict);
      impacts.push(impact);
    }

    const overallRobustnessScore = Math.max(0, 100 - (threatVectors.length * 10));
    const summary = `The simulation identified ${threatVectors.length} potential conflict vectors. The current plan's robustness score is ${overallRobustnessScore}/100. Focus on mitigating API failures and input ambiguity.`;

    return {
      threatModel: threatVectors,
      conflicts: conflicts,
      impacts: impacts,
      overallRobustnessScore: overallRobustnessScore,
      summary: summary,
    };
  }
}

export { AssumptionConflictSimulator };