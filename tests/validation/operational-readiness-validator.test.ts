import { describe, it, expect } from "vitest"
import { OperationalReadinessValidator } from "../src/validation/operational-readiness-validator"

describe("OperationalReadinessValidator", () => {
  it("should correctly determine readiness when all checks pass", async () => {
    const mockCheck1 = async (): Promise<any> => ({
      status: "PASS",
      serviceId: "serviceA",
      details: "Service A is operational",
      isCritical: true,
    })
    const mockCheck2 = async (): Promise<any> => ({
      status: "PASS",
      serviceId: "serviceB",
      details: "Service B is operational",
      isCritical: false,
    })

    const validator = new OperationalReadinessValidator([
      { serviceId: "serviceA", check: mockCheck1 },
      { serviceId: "serviceB", check: mockCheck2 },
    ])

    const result = await validator.validate()

    expect(result.overallStatus).toBe("READY")
    expect(result.isReady).toBe(true)
    expect(result.failedChecks).toHaveLength(0)
    expect(result.passedChecks).toHaveLength(2)
  })

  it("should determine DEGRADED when non-critical checks fail", async () => {
    const mockCheck1 = async (): Promise<any> => ({
      status: "PASS",
      serviceId: "serviceA",
      details: "Service A is operational",
      isCritical: true,
    })
    const mockCheck2 = async (): Promise<any> => ({
      status: "FAIL",
      serviceId: "serviceB",
      details: "Service B is degraded",
      isCritical: false,
    })
    const mockCheck3 = async (): Promise<any> => ({
      status: "PASS",
      serviceId: "serviceC",
      details: "Service C is operational",
      isCritical: false,
    })

    const validator = new OperationalReadinessValidator([
      { serviceId: "serviceA", check: mockCheck1 },
      { serviceId: "serviceB", check: mockCheck2 },
      { serviceId: "serviceC", check: mockCheck3 },
    ])

    const result = await validator.validate()

    expect(result.overallStatus).toBe("DEGRADED")
    expect(result.isReady).toBe(false)
    expect(result.failedChecks).toHaveLength(1)
    expect(result.failedChecks[0].serviceId).toBe("serviceB")
  })

  it("should determine UNAVAILABLE if any critical check fails", async () => {
    const mockCheck1 = async (): Promise<any> => ({
      status: "PASS",
      serviceId: "serviceA",
      details: "Service A is operational",
      isCritical: true,
    })
    const mockCheck2 = async (): Promise<any> => ({
      status: "FAIL",
      serviceId: "serviceB",
      details: "Service B is critical failure",
      isCritical: true,
    })

    const validator = new OperationalReadinessValidator([
      { serviceId: "serviceA", check: mockCheck1 },
      { serviceId: "serviceB", check: mockCheck2 },
    ])

    const result = await validator.validate()

    expect(result.overallStatus).toBe("UNAVAILABLE")
    expect(result.isReady).toBe(false)
    expect(result.failedChecks).toHaveLength(1)
    expect(result.failedChecks[0].serviceId).toBe("serviceB")
  })
)