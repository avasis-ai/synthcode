import { EventEmitter } from "node:events"

type Severity = "low" | "medium" | "high" | "critical"

export interface FeedbackPayload {
  source: string
  timestamp: number
  raw_data: Record<string, unknown>
  severity: Severity
  suggested_action: string
}

export interface PlanAdjustment {
  adjustment_type: "refine_prompt" | "modify_tool_call" | "reorder_steps" | "none"
  details: string
  confidence: number
}

export interface Observation {
  source: "external_feedback"
  timestamp: number
  processed_feedback: FeedbackPayload
  plan_adjustment: PlanAdjustment
}

export interface FeedbackRules {
  minSeverityForPrioritization: Severity
  requiredSourceForHighPriority: string
}

export class ExternalFeedbackLoopCoordinator extends EventEmitter {
  private rules: FeedbackRules

  constructor(rules: FeedbackRules) {
    super()
    this.rules = rules
  }

  private determinePlanAdjustment(payload: FeedbackPayload): PlanAdjustment {
    if (payload.severity === "critical" && payload.source === "Human Reviewer") {
      return {
        adjustment_type: "refine_prompt",
        details: `Critical feedback received: ${payload.suggested_action}`,
        confidence: 0.95
      }
    }
    if (payload.severity === "high" && payload.raw_data?.api_error) {
      return {
        adjustment_type: "modify_tool_call",
        details: "API error detected, suggesting tool modification.",
        confidence: 0.85
      }
    }
    return {
      adjustment_type: "none",
      details: "No immediate plan adjustment required.",
      confidence: 0.5
    }
  }

  private prioritizeFeedback(payload: FeedbackPayload): boolean {
    const severityValue: Record<Severity, number> = {
      "low": 1,
      "medium": 2,
      "high": 3,
      "critical": 4
    }

    const currentSeverityValue = severityValue[payload.severity] || 0
    const minSeverityValue = severityValue[this.rules.minSeverityForPrioritization] || 0

    const meetsSeverity = currentSeverityValue >= minSeverityValue
    const meetsSource = payload.source === this.rules.requiredSourceForHighPriority

    return meetsSeverity && (meetsSource || payload.severity === "critical")
  }

  processFeedback(payload: FeedbackPayload): Observation | null {
    if (!this.prioritizeFeedback(payload)) {
      return null
    }

    const planAdjustment = this.determinePlanAdjustment(payload)

    const observation: Observation = {
      source: "external_feedback",
      timestamp: payload.timestamp,
      processed_feedback: payload,
      plan_adjustment: planAdjustment
    }

    this.emit("observation_ready", observation)
    return observation
  }
}

export { ExternalFeedbackLoopCoordinator }