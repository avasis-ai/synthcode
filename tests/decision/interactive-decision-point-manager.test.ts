import { describe, it, expect, vi } from "vitest";
import { InteractiveDecisionPointManager, AgentContext, RequiredInputType } from "../src/decision/interactive-decision-point-manager";

describe("InteractiveDecisionPointManager", () => {
    it("should initialize correctly with a given context", () => {
        const mockContext: AgentContext = {
            history: [],
            state: { user: "test" },
        };
        const manager = new InteractiveDecisionPointManager(mockContext);
        expect(manager).toBeDefined();
        // Assuming the manager stores the context
        // If there's a getter, use it. Otherwise, check for basic functionality.
    });

    it("should generate a valid request object for human review", () => {
        const mockContext: AgentContext = {
            history: [{ role: "user", content: "Initial query" }],
            state: { step: 1 },
        };
        const manager = new InteractiveDecisionPointManager(mockContext);
        const request = manager.createRequest("Review required", "Please review the generated plan.", "human_review", { "plan_id": "mandatory", "reviewer_notes": "optional" });

        expect(request).toBeDefined();
        expect(request.requiredInputType).toBe("human_review");
        expect(request.contextSummary).toContain("Initial query");
        expect(request.mandatoryFields["plan_id"]).toBe("mandatory");
        expect(request.prompt).toBe("Please review the generated plan.");
    });

    it("should handle different required input types correctly", () => {
        const mockContext: AgentContext = {
            history: [],
            state: {},
        };
        const manager = new InteractiveDecisionPointManager(mockContext);

        // Test system confirmation
        let request = manager.createRequest("System Check", "Confirm system parameters.", "system_confirmation", {"param_a": "mandatory"});
        expect(request.requiredInputType).toBe("system_confirmation");

        // Test expert signoff
        request = manager.createRequest("Expert Signoff", "Expert review needed.", "expert_signoff", {"expert_name": "mandatory"});
        expect(request.requiredInputType).toBe("expert_signoff");

        // Test manual input
        request = manager.createRequest("Manual Input", "Please provide manual data.", "manual_input", {});
        expect(request.requiredInputType).toBe("manual_input");
    });
});