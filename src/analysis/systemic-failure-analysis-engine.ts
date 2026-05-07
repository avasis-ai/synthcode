import { EventEmitter } from "node:events"

type FailureType = "ResourceConstraintViolation" | "SchemaDrift" | "HighLoad" | "UnknownFailure"

export interface FailureDetail {
  type: FailureType
  message: string
  severity: "CRITICAL" | "ERROR" | "WARNING"
  context: Record<string, unknown>
}

export interface FailureReport {
  details: FailureDetail[]
  runId: string
  timestamp: Date
}

export type ImprovementAction = "addConstraint" | "modifyToolDefault" | "increaseResourceLimit" | "setPreProcessingStep"

export interface SystemicImprovementPayload {
  action: ImprovementAction
  target: string
  value: unknown
  justification: string
}

export interface SystemicImprovementRepository {
  saveImprovements(payloads: SystemicImprovementPayload[]): Promise<boolean>
}

class MockSystemicImprovementRepository implements SystemicImprovementRepository {
  private improvements: SystemicImprovementPayload[] = []

  async saveImprovements(payloads: SystemicImprovementPayload[]): Promise<boolean> {
    console.log("Saving systemic improvements...");
    this.improvements.push(...payloads)
    return true
  }
}

export class SystemicFailureAnalysisEngine {
  private repository: SystemicImprovementRepository

  constructor(repository: SystemicImprovementRepository) {
    this.repository = repository
  }

  private determineImprovement(report: FailureReport): SystemicImprovementPayload[] {
    const improvements: SystemicImprovementPayload[] = []
    const criticalFailures = report.details.filter(d => d.severity === "CRITICAL")

    if (criticalFailures.length === 0) {
      return []
    }

    const hasResourceIssue = criticalFailures.some(d => d.type === "ResourceConstraintViolation")
    const hasSchemaIssue = criticalFailures.some(d => d.type === "SchemaDrift")
    const hasHighLoad = criticalFailures.some(d => d.type === "HighLoad")

    if (hasResourceIssue && hasHighLoad) {
      improvements.push({
        action: "increaseResourceLimit",
        target: "Memory",
        value: 1.5,
        justification: "Combined resource and load failures suggest insufficient memory allocation.",
      })
    }

    if (hasSchemaIssue) {
      improvements.push({
        action: "setPreProcessingStep",
        target: "SchemaValidator",
        value: true,
        justification: "Schema drift requires mandatory pre-validation step to prevent runtime errors.",
      })
    }

    if (hasResourceIssue) {
      improvements.push({
        action: "addConstraint",
        target: "InputSize",
        value: 1024,
        justification: "Resource violations suggest input size constraints need tightening.",
      })
    }

    return improvements
  }

  public async analyze(failureReport: FailureReport): Promise<boolean> {
    const suggestedImprovements = this.determineImprovement(failureReport)

    if (suggestedImprovements.length === 0) {
      console.log("No systemic improvements suggested based on the failure report.");
      return false
    }

    console.log(`Found ${suggestedImprovements.length} systemic improvements.`);
    return await this.repository.saveImprovements(suggestedImprovements)
  }
}

export { SystemicFailureAnalysisEngine, MockSystemicImprovementRepository }