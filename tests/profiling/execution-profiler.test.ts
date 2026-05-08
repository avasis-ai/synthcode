import { describe, it, expect } from "vitest"
import { ExecutionProfiler } from "../src/profiling/execution-profiler"

describe("ExecutionProfiler", () => {
  it("should initialize correctly and track execution time", () => {
    const profiler = new ExecutionProfiler()
    expect(profiler).toBeInstanceOf(ExecutionProfiler)
    expect(profiler.getMetrics()).toEqual({})
  })

  it("should correctly record and calculate elapsed time for a single block", () => {
    const profiler = new ExecutionProfiler()
    const start = Date.now()
    profiler.start("testBlock")
    const end = Date.now()
    profiler.stop("testBlock")
    
    const metrics = profiler.getMetrics()
    expect(metrics["testBlock"]).toBeGreaterThanOrEqual(0)
    expect(metrics["testBlock"]).toBeLessThanOrEqual(Math.abs(end - start))
  })

  it("should accumulate metrics for multiple blocks and handle overlapping calls", () => {
    const profiler = new ExecutionProfiler()
    
    // Block 1
    profiler.start("blockA")
    setTimeout(() => {
      profiler.stop("blockA")
    }, 10)

    // Block 2 (starts immediately after Block 1 starts)
    profiler.start("blockB")
    setTimeout(() => {
      profiler.stop("blockB")
    }, 5)

    // Wait for timeouts to execute (simulating async flow)
    return new Promise((resolve) => {
      setTimeout(() => {
        const metrics = profiler.getMetrics()
        expect(metrics).toHaveProperty("blockA")
        expect(metrics).toHaveProperty("blockB")
        expect(Object.keys(metrics).length).toBe(2)
        resolve()
      }, 50)
    })
  })
})