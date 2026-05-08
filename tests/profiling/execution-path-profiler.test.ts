import { describe, it, expect } from "vitest";
import { PathProfiler } from "../src/profiling/execution-path-profiler";

describe("PathProfiler", () => {
    it("should initialize correctly", () => {
        const profiler = new PathProfiler();
        expect(profiler).toBeInstanceOf(PathProfiler);
    });

    it("should record a basic step metric", () => {
        const profiler = new PathProfiler();
        const step = profiler.startStep("testStep");
        const endStep = profiler.endStep("testStep", 100);
        expect(step).toBeDefined();
        expect(endStep).toBeDefined();
    });

    it("should calculate total latency and accumulate multiple steps", () => {
        const profiler = new PathProfiler();
        profiler.startStep("stepA");
        profiler.endStep("stepA", 50);
        profiler.startStep("stepB");
        profiler.endStep("stepB", 150);

        const metrics = profiler.getMetrics();
        expect(metrics.steps.length).toBe(2);
        expect(metrics.totalLatencyMs).toBeCloseTo(200, 0);
    });
});