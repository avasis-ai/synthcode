import { describe, it, expect } from "vitest"
import { VersionResolver, CompatibilityReport } from "../src/tool/version-resolver"

describe("VersionResolver", () => {
  it("should correctly resolve compatibility for compatible versions", async () => {
    const resolver = new VersionResolver()
    const report: CompatibilityReport = await resolver.checkCompatibility({
      toolName: "toolA",
      requiredVersion: { major: 1, minor: 2, patch: 0 },
      availableVersion: { major: 1, minor: 2, patch: 5 },
    })
    expect(report.isCompatible).toBe(true)
    expect(report.message).toContain("Compatible")
  })

  it("should report incompatibility when major versions mismatch", async () => {
    const resolver = new VersionResolver()
    const report: CompatibilityReport = await resolver.checkCompatibility({
      toolName: "toolB",
      requiredVersion: { major: 2, minor: 0, patch: 0 },
      availableVersion: { major: 1, minor: 5, patch: 0 },
    })
    expect(report.isCompatible).toBe(false)
    expect(report.message).toContain("Major version mismatch")
  })

  it("should handle patch version differences gracefully if minor versions match", async () => {
    const resolver = new VersionResolver()
    const report: CompatibilityReport = await resolver.checkCompatibility({
      toolName: "toolC",
      requiredVersion: { major: 3, minor: 4, patch: 1 },
      availableVersion: { major: 3, minor: 4, patch: 9 },
    })
    expect(report.isCompatible).toBe(true)
    expect(report.message).toContain("Compatible")
  })
})