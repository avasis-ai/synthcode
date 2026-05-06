import { Message } from "../types/message.js"

export interface AgentContext {
  messages: Message[]
  budgetUsed: number
  maxBudget: number
  userPermissions: Record<string, boolean>
  // Add other context properties as needed
}

export interface FailureDetail {
  checkName: string
  reason: string
  severity: "Error" | "Warning"
}

export interface ValidationResult {
  isValid: boolean
  failures: FailureDetail[]
}

export type PreflightCheck = (context: AgentContext) => ValidationResult

class PreflightCheckManager {
  private checks: PreflightCheck[]

  constructor(checks: PreflightCheck[]) {
    this.checks = checks
  }

  runChecks(context: AgentContext): ValidationResult {
    let allFailures: FailureDetail[] = []

    for (const check of this.checks) {
      const result = check(context)
      if (!result.isValid) {
        allFailures.push(...result.failures)
      }
    }

    const overallResult: ValidationResult = {
      isValid: allFailures.length === 0,
      failures: allFailures
    }

    return overallResult
  }
}

export { PreflightCheckManager }