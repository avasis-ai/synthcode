import { describe, it, expect } from "vitest";
import { CausalAssumptionProposer } from "../src/causality/causal-assumption-proposer";

describe("CausalAssumptionProposer", () => {
    it("should propose a plausible assumption when start and end states are significantly different", async () => {
        const proposer = new CausalAssumptionProposer();
        const startState = "User is browsing product A details page.";
        const endState = "User successfully completes checkout and receives confirmation.";
        const context = "The user navigated from the product page to the cart, but the checkout process failed due to payment rejection.";

        const result = await proposer.proposeAssumption(startState, endState, context);

        expect(result).toBeDefined();
        expect(result!.assumption.assumption).toContain("payment failure");
        expect(result!.assumption.requiredSteps).toHaveLength(2);
        expect(result!.remediationPlan).toContain("guide the user through");
    });

    it("should propose a low-confidence assumption when start and end states are similar but context is vague", async () => {
        const proposer = new CausalAssumptionProposer();
        const startState = "User views the main dashboard.";
        const endState = "User views the main dashboard.";
        const context = "The user spent some time on the dashboard but didn't click anything specific.";

        const result = await proposer.proposeAssumption(startState, endState, context);

        expect(result).toBeDefined();
        expect(result!.assumption.confidenceScore).toBeLessThan(0.5);
        expect(result!.assumption.assumption).toContain("user might be evaluating");
        expect(result!.remediationPlan).toContain("ask the user");
    });

    it("should propose a high-confidence assumption when a clear missing step is identified", async () => {
        const proposer = new CausalAssumptionProposer();
        const startState = "User adds item X to the cart.";
        const endState = "User successfully views the order summary.";
        const context = "The user was expected to proceed to the checkout, but the system logged an error indicating the cart was empty.";

        const result = await proposer.proposeAssumption(startState, endState, context);

        expect(result).toBeDefined();
        expect(result!.assumption.confidenceScore).toBeGreaterThan(0.8);
        expect(result!.assumption.assumption).toContain("cart state inconsistency");
        expect(result!.assumption.requiredSteps).toContain("verify cart contents");
    });
});