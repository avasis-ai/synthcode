export type Message = { role: "user" | "assistant" | "tool"; content: any };

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

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

export type ToolCall = {
  name: string;
  input: Record<string, unknown>;
};

export interface Hypothesis {
  hypothesisId: string;
  targetContext: string;
  testPlan: ToolCall[];
  successCriteria: (results: Record<string, string>) => boolean;
}

export interface TestResult {
  tool_call_id: string;
  output: string;
  success: boolean;
}

export interface HypothesisReport {
  hypothesisId: string;
  passed: boolean;
  observedResults: Record<string, string>;
  analysisSummary: string;
}

export class HypothesisEngine {
  private lastReport: HypothesisReport | null = null;

  constructor() {}

  /**
   * Formulates a hypothesis based on the current context and uncertainty.
   * In a real system, this would use LLM calls. Here, it takes a predefined structure.
   * @param hypothesis The structured hypothesis to test.
   * @returns The hypothesis object.
   */
  public formulate(hypothesis: Hypothesis): Hypothesis {
    return hypothesis;
  }

  /**
   * Executes the test plan in an isolated, controlled environment.
   * @param hypothesis The hypothesis containing the test plan.
   * @returns A promise resolving to the observed test results.
   */
  public async execute(hypothesis: Hypothesis): Promise<Record<string, string>> {
    console.log(`[HypothesisEngine] Executing test plan for ${hypothesis.hypothesisId}...`);
    
    const results: Record<string, string> = {};
    
    for (const toolCall of hypothesis.testPlan) {
      // Simulate tool execution
      const result = await this.simulateToolExecution(toolCall);
      results[`${toolCall.name}_result`] = result;
    }

    return results;
  }

  /**
   * Analyzes the observed results against the success criteria.
   * @param hypothesis The original hypothesis.
   * @param observedResults The results gathered from the test execution.
   * @returns A comprehensive report detailing the outcome.
   */
  public analyze(hypothesis: Hypothesis, observedResults: Record<string, string>): HypothesisReport {
    const passed = hypothesis.successCriteria(observedResults);
    
    const summary = passed 
      ? "Hypothesis confirmed. The observed results satisfy all success criteria."
      : "Hypothesis refuted. The observed results failed to meet the required success criteria.";

    const report: HypothesisReport = {
      hypothesisId: hypothesis.hypothesisId,
      passed: passed,
      observedResults: observedResults,
      analysisSummary: summary,
    };

    this.lastReport = report;
    return report;
  }

  /**
   * Orchestrates the full hypothesis testing lifecycle.
   * @param hypothesis The hypothesis to test.
   * @returns The final report.
   */
  public async executeHypothesis(hypothesis: Hypothesis): Promise<HypothesisReport> {
    const observedResults = await this.execute(hypothesis);
    const report = this.analyze(hypothesis, observedResults);
    return report;
  }

  /**
   * Private helper to simulate asynchronous tool execution.
   * @param toolCall The tool to execute.
   * @returns A promise resolving to the tool's output string.
   */
  private async simulateToolExecution(toolCall: ToolCall): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network latency
    
    if (toolCall.name === "search_database") {
      const input = toolCall.input as { query: string };
      return `Database search successful for query: "${input.query}". Found 3 records.`;
    }
    if (toolCall.name === "check_user_state") {
      return "User state confirmed: Active, Location: NYC, LastLogin: 2024-01-01.";
    }
    return `Execution successful for ${toolCall.name}.`;
  }
}

export { HypothesisEngine };