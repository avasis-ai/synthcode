import { describe, it, expect } from "vitest";
import { ContextualConstraintResolverV4 } from "../src/context/contextual-constraint-resolver-v4";
import { ContextSource, Context, Constraint, ConstraintViolation } from "../src/context/types";

describe("ContextualConstraintResolverV4", () => {
    it("should correctly validate temporal constraints when context is available", () => {
        const resolver = new ContextualConstraintResolverV4();
        const contextSource1: ContextSource = { name: "source1", getContext: () => ({ user: "Alice", role: "admin" }) };
        const contextSource2: ContextSource = { name: "source2", getContext: () => ({ department: "IT" }) };
        const contextSources: ContextSource[] = [contextSource1, contextSource2];

        const constraint: Constraint = {
            id: "temporal-check",
            message: "User must be admin in IT department",
            temporal: true,
            check: (context: Context) => context.user === "Alice" && context.department === "IT"
        };
        const constraints: Constraint[] = [constraint];

        const { isValid, violations } = resolver["checkTemporalConstraints"](contextSources, constraints);

        expect(isValid).toBe(true);
        expect(violations).toHaveLength(0);
    });

    it("should detect violation when temporal constraint fails", () => {
        const resolver = new ContextualConstraintResolverV4();
        const contextSource1: ContextSource = { name: "source1", getContext: () => ({ user: "Bob", role: "guest" }) };
        const contextSource2: ContextSource = { name: "source2", getContext: () => ({ department: "HR" }) };
        const contextSources: ContextSource[] = [contextSource1, contextSource2];

        const constraint: Constraint = {
            id: "temporal-check-fail",
            message: "User must be admin in IT department",
            temporal: true,
            check: (context: Context) => context.user === "Alice" && context.department === "IT"
        };
        const constraints: Constraint[] = [constraint];

        const { isValid, violations } = resolver["checkTemporalConstraints"](contextSources, constraints);

        expect(isValid).toBe(false);
        expect(violations).toHaveLength(1);
        expect(violations[0].constraintId).toBe("temporal-check-fail");
    });

    it("should return valid if no temporal constraints are present", () => {
        const resolver = new ContextualConstraintResolverV4();
        const contextSource1: ContextSource = { name: "source1", getContext: () => ({ user: "Test" }) };
        const contextSources: ContextSource[] = [contextSource1];

        const constraint: Constraint = {
            id: "non-temporal",
            message: "This is a simple check",
            temporal: false,
            check: (context: Context) => true
        };
        const constraints: Constraint[] = [constraint];

        const { isValid, violations } = resolver["checkTemporalConstraints"](contextSources, constraints);

        expect(isValid).toBe(true);
        expect(violations).toHaveLength(0);
    });
});