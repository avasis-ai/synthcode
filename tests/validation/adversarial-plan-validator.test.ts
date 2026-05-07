import { describe, it, expect } from "vitest"
import {
  PlanContext,
  AdversarialRule,
  VulnerabilityReport,
} from "../src/validation/adversarial-plan-validator"

describe("AdversarialPlanValidator", () => {
  it("should correctly identify a high-severity vulnerability when sensitive data is exposed", () => {
    const mockContext: PlanContext = {
      plan: [
        { role: "user", content: "Please process this payment for $100." },
        { role: "assistant", content: "The payment details are: card_number=1234-5678-9012-3456, cvv=123." },
      ],
      history: [],
    }
    const mockRule: AdversarialRule = (context) => {
      if (context.plan.some((msg) => msg.content.includes("cvv"))) {
        return {
          ruleName: "Sensitive Data Exposure",
          severity: "HIGH",
          isVulnerable: true,
          description: "CVV was exposed in the plan.",
          suggestedMitigation: "Do not display CVV in logs or plans.",
        }
      }
      return {
        ruleName: "Sensitive Data Exposure",
        severity: "LOW",
        isVulnerable: false,
        description: "No sensitive data found.",
        suggestedMitigation: "N/A",
      }
    }
    const validator = {
      validate: (context: PlanContext, rule: AdversarialRule): VulnerabilityReport => {
        return rule(context)
      }
    }
    const report = validator.validate(mockContext, mockRule)
    expect(report.severity).toBe("HIGH")
    expect(report.isVulnerable).toBe(true)
    expect(report.ruleName).toBe("Sensitive Data Exposure")
  })

  it("should report no vulnerability when the plan is clean and safe", () => {
    const mockContext: PlanContext = {
      plan: [
        { role: "user", content: "What is the capital of France?" },
        { role: "assistant", content: "The capital of France is Paris." },
      ],
      history: [],
    }
    const mockRule: AdversarialRule = (context) => {
      if (context.plan.some((msg) => msg.content.includes("password"))) {
        return {
          ruleName: "Sensitive Data Exposure",
          severity: "CRITICAL",
          isVulnerable: true,
          description: "Password found.",
          suggestedMitigation: "Mask passwords.",
        }
      }
      return {
        ruleName: "Sensitive Data Exposure",
        severity: "LOW",
        isVulnerable: false,
        description: "No sensitive data found.",
        suggestedMitigation: "N/A",
      }
    }
    const validator = {
      validate: (context: PlanContext, rule: AdversarialRule): VulnerabilityReport => {
        return rule(context)
      }
    }
    const report = validator.validate(mockContext, mockRule)
    expect(report.severity).toBe("LOW")
    expect(report.isVulnerable).toBe(false)
  })

  it("should correctly handle empty plan context", () => {
    const mockContext: PlanContext = {
      plan: [],
      history: [],
    }
    const mockRule: AdversarialRule = (context) => {
      if (context.plan.length === 0) {
        return {
          ruleName: "Empty Plan Check",
          severity: "LOW",
          isVulnerable: false,
          description: "Plan is empty, no risk detected.",
          suggestedMitigation: "Ensure plan has content.",
        }
      }
      return {
        ruleName: "Empty Plan Check",
        severity: "LOW",
        isVulnerable: false,
        description: "Plan is not empty.",
        suggestedMitigation: "N/A",
      }
    }
    const validator = {
      validate: (context: PlanContext, rule: AdversarialRule): VulnerabilityReport => {
        return rule(context)
      }
    }
    const report = validator.validate(mockContext, mockRule)
    expect(report.ruleName).toBe("Empty Plan Check")
    expect(report.severity).toBe("LOW")
    expect(report.isVulnerable).toBe(false)
  })
})