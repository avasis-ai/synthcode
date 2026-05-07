import { EventEmitter } from "node:events";

type ErrorType = "RateLimitError" | "AuthenticationError" | "MissingContext" | "ToolFailure" | "UnknownError";

interface FailureReport {
  context: string;
  failedStep: string;
  errorType: ErrorType;
  details: Record<string, unknown>;
}

interface RemediationStep {
  priority: number;
  action: "Retry" | "SwitchTool" | "EscalateHuman" | "QueryData" | "InformUser";
  description: string;
  suggestedParameters?: Record<string, unknown>;
}

class FailureRemediationPlanner {
  private readonly remediationRules: Record<ErrorType, (report: FailureReport) => RemediationStep[]>;

  constructor() {
    this.remediationRules = {
      RateLimitError: (report) => [
        {
          priority: 1,
          action: "Retry",
          description: "The service is rate-limited. Suggest retrying with an exponential backoff delay.",
          suggestedParameters: { delaySeconds: 30, attempts: 3 },
        },
        {
          priority: 2,
          action: "InformUser",
          description: "Inform the user that the request is temporarily throttled and they should wait.",
        },
      ],
      AuthenticationError: (report) => [
        {
          priority: 1,
          action: "InformUser",
          description: "Authentication failed. Check API keys, credentials, or required scopes.",
        },
        {
          priority: 2,
          action: "EscalateHuman",
          description: "Escalate to a human operator to verify credentials or permissions.",
        },
      ],
      MissingContext: (report) => [
        {
          priority: 1,
          action: "QueryData",
          description: "The failure suggests missing required context. Query the user or system for the necessary data.",
          suggestedParameters: { requiredFields: ["user_id", "resource_id"] },
        },
        {
          priority: 2,
          action: "InformUser",
          description: "Prompt the user to provide the missing information.",
        },
      ],
      ToolFailure: (report) => [
        {
          priority: 1,
          action: "SwitchTool",
          description: "The primary tool failed. Consider switching to a known backup or alternative tool.",
          suggestedParameters: { alternativeToolName: "BackupServiceV2" },
        },
        {
          priority: 2,
          action: "Retry",
          description: "Attempt the failed step again, but with different input parameters.",
        },
      ],
      UnknownError: (report) => [
        {
          priority: 1,
          action: "EscalateHuman",
          description: "An unknown or unhandled error occurred. Immediate human review is required.",
        },
        {
          priority: 2,
          action: "InformUser",
          description: "Log the full error stack and inform the user that the issue requires investigation.",
        },
      ],
    };
  }

  /**
   * Generates a prioritized, actionable plan of remediation steps based on a failure report.
   * @param report The structured failure report.
   * @returns A prioritized array of RemediationStep objects.
   */
  public generatePlan(report: FailureReport): RemediationStep[] {
    const rules = this.remediationRules[report.errorType];

    if (!rules) {
      return [{
        priority: 1,
        action: "InformUser",
        description: "No specific remediation plan found for this error type. Manual review required.",
      }];
    }

    let plan = rules(report);

    // Sort the plan by priority (lower number = higher priority)
    plan.sort((a, b) => a.priority - b.priority);

    return plan;
  }
}

export { FailureRemediationPlanner };