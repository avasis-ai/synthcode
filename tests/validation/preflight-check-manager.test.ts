import { describe, it, expect } from "vitest"
import { PreflightCheck, AgentContext, FailureDetail, ValidationResult } from "../src/validation/preflight-check-manager.js"

describe("PreflightCheck", () => {
  it("should return isValid true and no failures when context is valid", () => {
    const mockContext: AgentContext = {
      messages: [{ content: "Hello", role: "user" }],
      budgetUsed: 10,
      maxBudget: 100,
      userPermissions: { "tool_a": true, "tool_b": true },
    }
    const check: PreflightCheck = () => ({
      isValid: true,
      failures: [],
    })
    const result: ValidationResult = check(mockContext)
    expect(result.isValid).toBe(true)
    expect(result.failures).toHaveLength(0)
  })

  it("should return isValid false and list failures when budget is exceeded", () => {
    const mockContext: AgentContext = {
      messages: [{ content: "Hello", role: "user" }],
      budgetUsed: 150,
      maxBudget: 100,
      userPermissions: { "tool_a": true, "tool_b": true },
    }
    const check: PreflightCheck = () => {
      if (mockContext.budgetUsed > mockContext.maxBudget) {
        return {
          isValid: false,
          failures: [{
            checkName: "BudgetCheck",
            reason: "Budget exceeded",
            severity: "Error",
          }],
        }
      }
      return { isValid: true, failures: [] }
    }
    const result: ValidationResult = check(mockContext)
    expect(result.isValid).toBe(false)
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0].checkName).toBe("BudgetCheck")
    expect(result.failures[0].severity).toBe("Error")
  })

  it("should aggregate multiple failures from different checks", () => {
    const mockContext: AgentContext = {
      messages: [],
      budgetUsed: 50,
      maxBudget: 100,
      userPermissions: { "tool_a": false, "tool_b": true },
    }
    const check: PreflightCheck = () => {
      const failures: FailureDetail[] = []
      if (mockContext.messages.length === 0) {
        failures.push({
          checkName: "MessageHistoryCheck",
          reason: "No message history found",
          severity: "Warning",
        })
      }
      if (!mockContext.userPermissions["tool_a"]) {
        failures.push({
          checkName: "PermissionCheck",
          reason: "Missing required tool permission: tool_a",
          severity: "Error",
        })
      }
      return {
        isValid: failures.length === 0,
        failures: failures,
      }
    }
    const result: ValidationResult = check(mockContext)
    expect(result.isValid).toBe(false)
    expect(result.failures).toHaveLength(2)
    expect(result.failures.some(f => f.checkName === "MessageHistoryCheck")).toBe(true)
    expect(result.failures.some(f => f.checkName === "PermissionCheck")).toBe(true)
  })
})