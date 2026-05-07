import { describe, it, expect } from "vitest";
import { PlanAdjuster } from "./reactive-plan-adjuster";

describe("PlanAdjuster", () => {
    it("should recommend RETRY_BACKOFF when a resource is critical", () => {
        const jobContext = {
            jobId: "job123",
            currentStep: "data_fetch",
            history: [{ role: "tool", content: { error: "Resource unavailable" } }],
            resourceStatus: { "api_gateway": "critical", "database": "ok" },
        };
        const adjuster = new PlanAdjuster(jobContext);
        const adjustment = adjuster.adjustPlan();
        expect(adjustment.action).toBe("RETRY_BACKOFF");
    });

    it("should recommend SWITCH_TOOL when a resource is degraded and the error suggests an alternative", () => {
        const jobContext = {
            jobId: "job456",
            currentStep: "processing",
            history: [{ role: "tool", content: { error: "Tool A failed, try Tool B" } }],
            resourceStatus: { "api_gateway": "degraded", "database": "ok" },
        };
        const adjuster = new PlanAdjuster(jobContext);
        const adjustment = adjuster.adjustPlan();
        expect(adjustment.action).toBe("SWITCH_TOOL");
    });

    it("should recommend CONTINUE when no critical issues are detected", () => {
        const jobContext = {
            jobId: "job789",
            currentStep: "final_step",
            history: [{ role: "user", content: "Final request" }],
            resourceStatus: { "api_gateway": "ok", "database": "ok" },
        };
        const adjuster = new PlanAdjuster(jobContext);
        const adjustment = adjuster.adjustPlan();
        expect(adjustment.action).toBe("CONTINUE");
    });
});