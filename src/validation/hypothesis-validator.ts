import { Message, ContentBlock, ToolUseBlock } from "./types";

type ToolCall = {
  toolName: string;
  input: Record<string, unknown>;
};

interface Hypothesis {
  hypothesis: string;
  requiredContext: string[];
  testSteps: ToolCall[];
}

interface ValidationStepResult {
  step: ToolCall;
  success: boolean;
  evidence: string;
  confidenceAdjustment: number;
}

interface HypothesisValidationReport {
  hypothesis: string;
  overallConfidenceScore: number;
  validationReport: {
    contextCheckPassed: boolean;
    toolExecutionResults: ValidationStepResult[];
    summary: string;
  };
  suggestedRefinementPlan: string[];
}

export class HypothesisValidator {
  private readonly context: Message[];

  constructor(context: Message[]) {
    this.context = context;
  }

  private checkContext(requiredContext: string[]): { passed: boolean; missing: string[] } {
    const foundContext: Set<string> = new Set<string>();
    this.context.forEach(msg => {
      if (msg.role === "tool" && msg.content) {
        // Simple extraction simulation
        const contentText = typeof msg.content === "string" ? msg.content : "";
        if (contentText) {
          foundContext.add(contentText.substring(0, 50));
        }
      }
    });

    const missing: string[] = requiredContext.filter(req => !Array.from(foundContext).some(found => found.includes(req)));
    return { passed: missing.length === 0, missing };
  }

  private executeStep(step: ToolCall): ValidationStepResult {
    // Simulate tool execution and result aggregation
    console.log(`Executing step for tool: ${step.toolName}`);

    // Mock logic: Assume success if the tool name is not 'fail_tool'
    const success = step.toolName !== "fail_tool";
    const evidence = success
      ? `Successfully executed ${step.toolName} with input ${JSON.stringify(step.input)}. Evidence gathered.`
      : `Failed to execute ${step.toolName}. Input validation failed or resource constraint violated.`;

    const confidenceAdjustment = success ? 0.15 : -0.2;

    return {
      step,
      success,
      evidence,
      confidenceAdjustment,
    };
  }

  public validate(hypothesis: Hypothesis): HypothesisValidationReport {
    const contextCheck = this.checkContext(hypothesis.requiredContext);
    const toolResults: ValidationStepResult[] = hypothesis.testSteps.map(step => this.executeStep(step));

    let totalConfidenceAdjustment = 0;
    let refinementPlan: string[] = [];

    toolResults.forEach(result => {
      totalConfidenceAdjustment += result.confidenceAdjustment;
    });

    const initialConfidence = 0.5;
    let overallConfidenceScore = Math.min(1.0, Math.max(0.0, initialConfidence + totalConfidenceAdjustment));

    if (!contextCheck.passed) {
      overallConfidenceScore -= 0.1;
      refinementPlan.push(`Missing required context: ${contextCheck.missing.join(', ')}. Please provide this information.`);
    }

    const summary = toolResults.map(r =>
      `${r.step.toolName} Status: ${r.success ? 'PASS' : 'FAIL'} (Evidence: ${r.evidence.substring(0, 40)}...)`
    ).join("\n");

    if (overallConfidenceScore < 0.5) {
      refinementPlan.push("Hypothesis is weakly supported. Review counter-evidence.");
    }

    return {
      hypothesis: hypothesis.hypothesis,
      overallConfidenceScore: parseFloat(overallConfidenceScore.toFixed(2)),
      validationReport: {
        contextCheckPassed: contextCheck.passed,
        toolExecutionResults: toolResults,
        summary: summary,
      },
      suggestedRefinementPlan: refinementPlan,
    };
  }
}