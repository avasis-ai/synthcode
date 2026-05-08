import { Message } from "../types/types.js";

type AgentState = Record<string, any>;
type AgentPlan = string[];
type TriggerMetrics = {
  confidenceScore: number;
  conflictDetected: boolean;
  resourceOveruse: number;
  stateDrift: boolean;
};

export interface CritiqueContext {
  currentState: AgentState;
  currentPlan: AgentPlan;
  triggerMetrics: TriggerMetrics;
  history: Message[];
}

export interface CritiqueResult {
  critiqueSummary: string;
  mitigationSteps: string[];
  confidenceAdjustment: number;
  isCritiqueNecessary: boolean;
}

export interface CritiqueStep {
  name: string;
  execute(context: CritiqueContext): string;
}

class CritiqueEngine {
  constructor(private steps: CritiqueStep[]) {}

  async critique(context: CritiqueContext): Promise<CritiqueResult> {
    let combinedCritique = "";
    let totalConfidenceAdjustment = 0;
    let mitigationSteps: string[] = [];

    for (const step of this.steps) {
      try {
        const critiqueSegment = step.execute(context);
        combinedCritique += `\n--- ${step.name} ---\n${critiqueSegment}`;
        
        // Simulate confidence adjustment based on step output complexity/severity
        if (step.name.includes("Conflict")) {
            totalConfidenceAdjustment -= 0.1;
        } else if (step.name.includes("Confidence")) {
            totalConfidenceAdjustment += 0.05;
        }
      } catch (error) {
        combinedCritique += `\n[ERROR during ${step.name}: ${error instanceof Error ? error.message : String(error)}]`;
      }
    }

    const isCritiqueNecessary = context.triggerMetrics.conflictDetected || context.triggerMetrics.stateDrift;

    return {
      critiqueSummary: combinedCritique,
      mitigationSteps: mitigationSteps.length > 0 ? mitigationSteps : ["Review the generated critique summary for actionable insights."],
      confidenceAdjustment: totalConfidenceAdjustment,
      isCritiqueNecessary: isCritiqueNecessary,
    };
  }
}

class ConflictAnalysisStep implements CritiqueStep {
  name = "Conflict Analysis";

  execute(context: CritiqueContext): string {
    if (!context.triggerMetrics.conflictDetected) {
      return "No explicit conflicts detected based on current metrics.";
    }

    const historyConflict = context.history.filter(m => m.role === "tool");
    if (historyConflict.length === 0) {
      return "Conflict detected, but no recent tool results were available for deep analysis.";
    }

    const conflictDetails = historyConflict.map(m => 
      `Tool ${m.tool_use_id} reported: ${m.content.substring(0, 50)}...`
    ).join("\n");

    return `Potential conflicts identified between previous tool outputs and current state. Details:\n${conflictDetails}\nAction required: Reconcile conflicting data points.`;
  }
}

class ConfidenceAssessmentStep implements CritiqueStep {
  name = "Confidence Assessment";

  execute(context: CritiqueContext): string {
    if (context.triggerMetrics.confidenceScore > 0.8) {
      return "High confidence score maintained. No immediate self-correction needed.";
    }

    const confidenceLevel = Math.max(0, context.triggerMetrics.confidenceScore);
    return `Current confidence level is low (${confidenceLevel.toFixed(2)}). Reviewing the plan for potential oversimplification or missing assumptions.`;
  }
}

class MitigationProposalStep implements CritiqueStep {
  name = "Mitigation Proposal";

  execute(context: CritiqueContext): string {
    const mitigation = [];
    if (context.triggerMetrics.resourceOveruse > 0.9) {
      mitigation.push("Reduce the scope of the next step or break down the task into smaller, sequential sub-tasks.");
    }
    if (context.triggerMetrics.stateDrift) {
      mitigation.push("Re-validate the current state against the initial goal state to identify the source of drift.");
    }
    
    if (mitigation.length === 0) {
      return "No critical mitigation steps proposed at this time.";
    }

    return "Proposed Mitigation Steps:\n- " + mitigation.join("\n- ");
  }
}

export { CritiqueEngine, ConflictAnalysisStep, ConfidenceAssessmentStep, MitigationProposalStep };