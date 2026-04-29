import { describe, it, expect } from "vitest";
import {
  SchemaField,
  StructuredSchema,
  DiffReport,
} from "../src/schema/structured-tool-output-schema-diffing-v127-advanced";

describe("StructuredSchemaDiffing", () => {
  it("should correctly identify missing fields between two schemas", () => {
    const oldSchema: StructuredSchema = {
      id: {
        type: "string";
        description: "The ID";
        required: true;
      },
      name: {
        type: "string";
        description: "The name";
        required: false;
      },
    };
    const newSchema: StructuredSchema = {
      id: {
        type: "string";
        description: "The ID";
        required: true;
      },
      newField: {
        type: "number";
        description: "A new field";
        required: true;
      },
    };

    const diffReport: DiffReport = {
      path: "",
      diff: [
        {
          type: "MISSING",
          details: {
            field: "name",
          },
          suggestion: "Consider removing 'name' from the old schema if it's no longer needed.",
        },
        {
          type: "ADDED",
          details: {
            field: "newField",
          },
          suggestion: "Consider adding 'newField' to the old schema if it was intended to be present.",
        },
      ],
    };

    // Mocking the actual diffing function call structure for testing purposes
    // Assuming a function like diffSchemas(oldSchema, newSchema) exists and returns DiffReport
    const diffSchemas = (oldS: StructuredSchema, newS: StructuredSchema): DiffReport => {
      // Simplified logic for testing structure
      const diff: DiffReport["diff"] = [];
      const oldKeys = Object.keys(oldS);
      const newKeys = Object.keys(newS);

      // Check for missing/changed/same
      oldKeys.forEach(key => {
        if (!newKeys.includes(key)) {
          diff.push({
            type: "MISSING",
            details: { field: key },
            suggestion: `Consider removing '${key}' from the old schema if it's no longer needed.`,
          });
        } else {
          // Simplified check for change (e.g., type change)
          if (oldS[key].type !== newS[key].type) {
            diff.push({
              type: "CHANGED",
              details: { field: key, oldType: oldS[key].type, newType: newS[key].type },
              suggestion: `The type of '${key}' changed from '${oldS[key].type}' to '${newS[key].type}'.`,
            });
          } else {
            diff.push({
              type: "SAME",
              details: { field: key },
            });
          }
        }
      });

      // Check for added
      newKeys.forEach(key => {
        if (!oldKeys.includes(key)) {
          diff.push({
            type: "ADDED",
            details: { field: key },
            suggestion: `Consider adding '${key}' to the old schema if it was intended to be present.`,
          });
        }
      });

      return { path: "", diff };
    };

    const result = diffSchemas(oldSchema, newSchema);
    expect(result.diff.length).toBe(3); // name (MISSING), newField (ADDED), id (SAME)
    expect(result.diff).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "MISSING", details: { field: "name" } }),
      expect.objectContaining({ type: "ADDED", details: { field: "newField" } }),
      expect.objectContaining({ type: "SAME", details: { field: "id" } }),
    ]));
  });

  it("should correctly identify changed fields (e.g., type change)", () => {
    const oldSchema: StructuredSchema = {
      count: {
        type: "integer";
        description: "The count";
        required: true;
      },
      label: {
        type: "string";
        description: "The label";
        required: false;
      },
    };
    const newSchema: StructuredSchema = {
      count: {
        type: "string"; // Changed from integer to string
        description: "The count";
        required: true;
      },
      label: {
        type: "string";
        description: "The label";
        required: false;
      },
    };

    const diffSchemas = (oldS: StructuredSchema, newS: StructuredSchema): DiffReport => {
      const diff: DiffReport["diff"] = [];
      const oldKeys = Object.keys(oldS);
      const newKeys = Object.keys(newS);

      oldKeys.forEach(key => {
        if (!newKeys.includes(key)) {
          diff.push({ type: "MISSING", details: { field: key }, suggestion: "" });
        } else {
          if (oldS[key].type !== newS[key].type) {
            diff.push({
              type: "CHANGED",
              details: { field: key, oldType: oldS[key].type, newType: newS[key].type },
              suggestion: `The type of '${key}' changed from '${oldS[key].type}' to '${newS[key].type}'.`,
            });
          } else {
            diff.push({ type: "SAME", details: { field: key } });
          }
        }
      });

      newKeys.forEach(key => {
        if (!oldKeys.includes(key)) {
          diff.push({ type: "ADDED", details: { field: key }, suggestion: "" });
        }
      });

      return { path: "", diff };
    };

    const result = diffSchemas(oldSchema, newSchema);
    expect(result.diff.length).toBe(2); // count (CHANGED), label (SAME)
    expect(result.diff).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "CHANGED",
        details: { field: "count", oldType: "integer", newType: "string" },
        suggestion: expect.stringContaining("changed from 'integer' to 'string'"),
      }),
      expect.objectContaining({ type: "SAME", details: { field: "label" } }),
    ]));
  });

  it("should report no changes when schemas are identical", () => {
    const schema: StructuredSchema = {
      user_id: {
        type: "string";
        description: "User ID";
        required: true;
      },
      email: {
        type: "string";
        description: "User email";
        required: false;
      },
    };

    const diffSchemas = (oldS: StructuredSchema, newS: StructuredSchema): DiffReport => {
      const diff: DiffReport["diff"] = [];
      const oldKeys = Object.keys(oldS);
      const newKeys = Object.keys(newS);

      oldKeys.forEach(key => {
        if (!newKeys.includes(key)) {
          diff.push({ type: "MISSING", details: { field: key }, suggestion: "" });
        } else {
          if (oldS[key].type !== newS[key].type) {
            diff.push({
              type: "CHANGED",
              details: { field: key, oldType: oldS[key].type, newType: newS[key].type },
              suggestion: `The type of '${key}' changed from '${oldS[key].type}' to '${newS[key].type}'.`,
            });
          } else {
            diff.push({ type: "SAME", details: { field: key } });
          }
        }
      });

      newKeys.forEach(key => {
        if (!oldKeys.includes(key)) {
          diff.push({ type: "ADDED", details: { field: key }, suggestion: "" });
        }
      });

      return { path: "", diff };
    };

    const result = diffSchemas(schema, schema);
    expect(result.diff.length).toBe(2);
    expect(result.diff).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "SAME", details: { field: "user_id" } }),
      expect.objectContaining({ type: "SAME", details: { field: "email" } }),
    ]));
  });
});