import { describe, it, expect } from "vitest"
import { BehavioralComplianceFilter, BehavioralRule } from "../src/policy/behavioral-compliance-filter.js"

describe("BehavioralComplianceFilter", () => {
  it("should return compliant if all rules pass", () => {
    const mockRules: BehavioralRule[] = [
      {
        name: "Rule 1",
        check: (output, context) => ({ compliant: true, reason: "OK" }),
      },
      {
        name: "Rule 2",
        check: (output, context) => ({ compliant: true, reason: "OK" }),
      },
    ]
    const filter = new BehavioralComplianceFilter(mockRules)
    const result = filter.run(
      "Test output",
      [{ role: "user", content: "Context" }]
    )
    expect(result.compliant).toBe(true)
    expect(result.reasons).toEqual(["OK", "OK"])
  })

  it("should return non-compliant and the first failing rule's reason if any rule fails", () => {
    const mockRules: BehavioralRule[] = [
      {
        name: "Rule 1",
        check: (output, context) => ({ compliant: true, reason: "OK" }),
      },
      {
        name: "Rule 2",
        check: (output, context) => ({ compliant: false, reason: "Violation detected" }),
      },
      {
        name: "Rule 3",
        check: (output, context) => ({ compliant: false, reason: "Another violation" }),
      },
    ]
    const filter = new BehavioralComplianceFilter(mockRules)
    const result = filter.run(
      "Test output",
      [{ role: "user", content: "Context" }]
    )
    expect(result.compliant).toBe(false)
    expect(result.reasons).toEqual(["OK", "Violation detected", "Another violation"])
    expect(result.firstFailureReason).toBe("Violation detected")
  })

  it("should handle an empty set of rules gracefully", () => {
    const mockRules: BehavioralRule[] = []
    const filter = new BehavioralComplianceFilter(mockRules)
    const result = filter.run("Any output", [])
    expect(result.compliant).toBe(true)
    expect(result.reasons).toEqual([])
    expect(result.firstFailureReason).toBeUndefined()
  })
})