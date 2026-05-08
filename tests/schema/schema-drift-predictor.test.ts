import { describe, it, expect } from "vitest";
import { SchemaDriftPredictor } from "../src/schema/schema-drift-predictor";

describe("SchemaDriftPredictor", () => {
    it("should predict drift when a required field is missing", () => {
        const predictor = new SchemaDriftPredictor();
        const schema: Schema = {
            id: { type: "string", required: true, description: "User ID" },
            name: { type: "string", required: false, description: "User Name" },
        };
        const driftReport = predictor.predict(schema, {
            data: { name: "Alice" }
        });

        expect(driftReport).toHaveLength(1);
        expect(driftReport[0].field).toBe("id");
        expect(driftReport[0].severity).toBe("critical");
        expect(driftReport[0].suggestedAction).toBe("defaulting");
    });

    it("should predict drift when an expected type is violated (e.g., number expected, string observed)", () => {
        const predictor = new SchemaDriftPredictor();
        const schema: Schema = {
            age: { type: "number", required: true, description: "User Age" },
            isActive: { type: "boolean", required: true, description: "Is Active" },
        };
        const driftReport = predictor.predict(schema, {
            data: { age: "twenty-five", isActive: "yes" }
        });

        expect(driftReport).toHaveLength(2);
        expect(driftReport).toEqual(expect.arrayContaining([
            expect.objectContaining({
                field: "age",
                expectedType: "number",
                observedType: "string",
                severity: "critical",
                suggestedAction: "coercion",
            }),
            expect.objectContaining({
                field: "isActive",
                expectedType: "boolean",
                observedType: "string",
                severity: "warning",
                suggestedAction: "coercion",
            }),
        ]));
    });

    it("should return an empty report if the data conforms to the schema", () => {
        const predictor = new SchemaDriftPredictor();
        const schema: Schema = {
            id: { type: "string", required: true, description: "User ID" },
            age: { type: "number", required: false, description: "User Age" },
        };
        const data = {
            id: "u123",
            age: 30
        };
        const driftReport = predictor.predict(schema, {
            data: data
        });

        expect(driftReport).toHaveLength(0);
    });
});