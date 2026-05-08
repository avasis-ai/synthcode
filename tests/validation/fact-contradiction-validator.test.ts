import { describe, it, expect } from "vitest";
import { FactContradictionValidator } from "../src/validation/fact-contradiction-validator";

describe("FactContradictionValidator", () => {
    it("should detect a contradiction when two facts use known contradictory predicates", () => {
        const validator = new FactContradictionValidator();
        const factA: Fact = { subject: "Alice", predicate: "is_alive", object: "World", sourceId: "s1" };
        const factB: Fact = { subject: "Alice", predicate: "is_deceased", object: "World", sourceId: "s2" };

        const result = validator.checkContradiction([factA, factB]);

        expect(result).toHaveLength(1);
        expect(result[0].factA).toEqual(factA);
        expect(result[0].factB).toEqual(factB);
        expect(result[0].reason).toContain("is_alive and is_deceased");
    });

    it("should not detect a contradiction when facts are consistent", () => {
        const validator = new FactContradictionValidator();
        const factA: Fact = { subject: "Bob", predicate: "lives_in", object: "CityA", sourceId: "s1" };
        const factB: Fact = { subject: "Bob", predicate: "has_age", object: "30", sourceId: "s2" };

        const result = validator.checkContradiction([factA, factB]);

        expect(result).toHaveLength(0);
    });

    it("should handle multiple pairs of contradictory facts", () => {
        const validator = new FactContradictionValidator();
        const factA1: Fact = { subject: "Charlie", predicate: "is_alive", object: "World", sourceId: "s1" };
        const factB1: Fact = { subject: "Charlie", predicate: "is_deceased", object: "World", sourceId: "s2" };
        const factA2: Fact = { subject: "David", predicate: "is_alive", object: "World", sourceId: "s3" };
        const factB2: Fact = { subject: "David", predicate: "is_deceased", object: "World", sourceId: "s4" };

        const result = validator.checkContradiction([factA1, factB1, factA2, factB2]);

        expect(result).toHaveLength(2);
    });
});