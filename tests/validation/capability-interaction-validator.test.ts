import { describe, it, expect } from "vitest";
import {
    CapabilityInteractionValidator,
    ConflictDetail,
    CapabilityInteractionRule
} from "../src/validation/capability-interaction-validator";

describe("CapabilityInteractionValidator", () => {
    it("should detect a conflict when two specified capabilities are used together", () => {
        const rules: CapabilityInteractionRule[] = [
            {
                conflictingCapabilities: ["capabilityA", "capabilityB"],
                severity: "CRITICAL",
                reason: "A and B conflict severely."
            }
        ];
        const validator = new CapabilityInteractionValidator(rules);
        const conflicts: ConflictDetail[] = validator.validate(["capabilityA", "capabilityB"]);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].capabilities).toEqual(["capabilityA", "capabilityB"]);
        expect(conflicts[0].reason).toBe("A and B conflict severely.");
        expect(conflicts[0].severity).toBe("CRITICAL");
    });

    it("should return no conflicts when only non-conflicting capabilities are used", () => {
        const rules: CapabilityInteractionRule[] = [
            {
                conflictingCapabilities: ["capabilityX", "capabilityY"],
                severity: "WARNING",
                reason: "X and Y might conflict."
            }
        ];
        const validator = new CapabilityInteractionValidator(rules);
        const capabilities = ["capabilityA", "capabilityB"]; // Assuming A and B are not in rules
        const conflicts: ConflictDetail[] = validator.validate(capabilities);

        expect(conflicts).toHaveLength(0);
    });

    it("should handle multiple conflict rules and detect all violations", () => {
        const rules: CapabilityInteractionRule[] = [
            {
                conflictingCapabilities: ["cap1", "cap2"],
                severity: "CRITICAL",
                reason: "Conflict 1"
            },
            {
                conflictingCapabilities: ["cap1", "cap3"],
                severity: "WARNING",
                reason: "Conflict 2"
            }
        ];
        const validator = new CapabilityInteractionValidator(rules);
        const capabilities = ["cap1", "cap2", "cap3"];
        const conflicts: ConflictDetail[] = validator.validate(capabilities);

        expect(conflicts).toHaveLength(2);
        // Check if both unique conflict pairs are detected
        const conflictReasons = conflicts.map(c => c.reason);
        expect(conflictReasons).toContain("Conflict 1");
        expect(conflictReasons).toContain("Conflict 2");
    });
});