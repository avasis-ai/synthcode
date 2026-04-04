import { describe, it, expect } from "vitest";
import { SchemaDriftDetector } from "../src/tool/schema-drift-detector";

describe("SchemaDriftDetector", () => {
    it("should detect missing fields when comparing against a baseline", () => {
        const baselineSchema = {
            name: "string",
            age: "number",
            email: "string",
        };
        const detector = new SchemaDriftDetector(baselineSchema);
        const currentSchema = {
            name: "string",
            age: "number",
        };
        const drift = detector.detectDrift(currentSchema);
        expect(drift).toEqual(["email"]);
    });

    it("should detect extra fields when comparing against a baseline", () => {
        const baselineSchema = {
            name: "string",
            age: "number",
        };
        const detector = new SchemaDriftDetector(baselineSchema);
        const currentSchema = {
            name: "string",
            age: "number",
            city: "string",
        };
        const drift = detector.detectDrift(currentSchema);
        expect(drift).toEqual(["city"]);
    });

    it("should detect type changes when comparing against a baseline", () => {
        const baselineSchema = {
            name: "string",
            isActive: "boolean",
        };
        const detector = new SchemaDriftDetector(baselineSchema);
        const currentSchema = {
            name: "string",
            isActive: "string",
        };
        const drift = detector.detectDrift(currentSchema);
        expect(drift).toEqual(["isActive"]);
    });
});