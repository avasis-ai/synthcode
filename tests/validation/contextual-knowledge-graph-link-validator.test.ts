import { describe, it, expect } from "vitest";
import { ContextualKnowledgeGraphLinkValidator } from "../src/validation/contextual-knowledge-graph-link-validator";
import { SchemaRegistry } from "../src/schema-registry";
import { KnowledgeGraphPayload } from "../src/knowledge-graph-payload";

describe("ContextualKnowledgeGraphLinkValidator", () => {
  it("should return invalid if payload has no edges", () => {
    const mockSchemaRegistry = {
      getSchema: () => ({}),
    } as unknown as SchemaRegistry;
    const validator = new ContextualKnowledgeGraphLinkValidator(mockSchemaRegistry);
    const payload: KnowledgeGraphPayload = { edges: [] };
    const result = validator.validate(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Payload must contain at least one edge.");
  });

  it("should return valid if all edges are correctly formed", () => {
    const mockSchemaRegistry = {
      getSchema: () => ({}),
    } as unknown as SchemaRegistry;
    const validator = new ContextualKnowledgeGraphLinkValidator(mockSchemaRegistry);
    const validPayload: KnowledgeGraphPayload = {
      edges: [
        {
          source: "node1",
          target: "node2",
          type: "RELATES_TO",
          properties: { weight: 0.8 },
        },
      ],
    };
    const result = validator.validate(validPayload);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with specific errors for malformed edges", () => {
    const mockSchemaRegistry = {
      getSchema: () => ({}),
    } as unknown as SchemaRegistry;
    const validator = new ContextualKnowledgeGraphLinkValidator(mockSchemaRegistry);
    const invalidPayload: KnowledgeGraphPayload = {
      edges: [
        { source: "node1", target: "node2", type: "RELATES_TO" }, // Missing properties
        { source: "node3", target: "node4", type: "UNKNOWN_TYPE" }, // Unknown type
      ],
    };
    const result = validator.validate(invalidPayload);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("Edge at index 0 is missing required properties.");
    expect(result.errors).toContain("Edge at index 1 has an unknown edge type: UNKNOWN_TYPE.");
  });
});