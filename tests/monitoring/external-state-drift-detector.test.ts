import { describe, it, expect, vi } from "vitest"
import { DriftDetectorOptions, DriftReport } from "../src/monitoring/external-state-drift-detector"
import { DriftDetector } from "../src/monitoring/external-state-drift-detector"

describe("DriftDetector", () => {
  it("should initialize and detect drift when state changes significantly", async () => {
    const mockDiffFunction = vi.fn((current: any, baseline: any) => ({
      keyA: current.a - baseline.a,
      keyB: current.b - baseline.b,
    }))
    const mockRemediationCallback = vi.fn(async (report: DriftReport) => {
      console.log("Remediating drift...")
    })

    const detector = new DriftDetector(
      { diffFunction: mockDiffFunction, remediationCallback: mockRemediationCallback }
    )

    const initialBaseline = { a: 10, b: 20 }
    const driftedState = { a: 15, b: 22 }

    // Simulate setting the baseline
    await detector.setBaseline(initialBaseline)

    // Simulate detecting drift
    await detector.detectDrift(driftedState)

    expect(mockDiffFunction).toHaveBeenCalledWith(driftedState, initialBaseline)
    expect(mockRemediationCallback).toHaveBeenCalledTimes(1)
    const report = mockRemediationCallback.mock.calls[0][0] as DriftReport
    expect(report.isDriftDetected).toBe(true)
    expect(report.details).toEqual({
      keyA: 5,
      keyB: 2,
    })
  })

  it("should not report drift if the state is within acceptable limits", async () => {
    const mockDiffFunction = vi.fn((current: any, baseline: any) => ({
      keyA: current.a - baseline.a,
      keyB: current.b - baseline.b,
    }))
    const mockRemediationCallback = vi.fn()

    const detector = new DriftDetector(
      { diffFunction: mockDiffFunction, remediationCallback: mockRemediationCallback }
    )

    const initialBaseline = { a: 10, b: 20 }
    const stableState = { a: 10.5, b: 20.1 }

    await detector.setBaseline(initialBaseline)
    await detector.detectDrift(stableState)

    expect(mockDiffFunction).toHaveBeenCalledWith(stableState, initialBaseline)
    expect(mockRemediationCallback).not.toHaveBeenCalled()
  })

  it("should handle multiple drift detection cycles correctly", async () => {
    const mockDiffFunction = vi.fn((current: any, baseline: any) => ({
      keyA: current.a - baseline.a,
      keyB: current.b - baseline.b,
    }))
    const mockRemediationCallback = vi.fn()

    const detector = new DriftDetector(
      { diffFunction: mockDiffFunction, remediationCallback: mockRemediationCallback }
    )

    const baseline = { a: 10, b: 20 }
    const state1 = { a: 11, b: 20 }
    const state2 = { a: 15, b: 25 }

    await detector.setBaseline(baseline)
    await detector.detectDrift(state1)
    await detector.detectDrift(state2)

    expect(mockDiffFunction).toHaveBeenCalledTimes(2)
    expect(mockDiffFunction).toHaveBeenCalledWith(state1, baseline)
    expect(mockDiffFunction).toHaveBeenCalledWith(state2, baseline)
    expect(mockRemediationCallback).toHaveBeenCalledTimes(1) // Only the second drift should trigger remediation
  })
})