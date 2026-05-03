import { describe, it, expect } from "vitest";
import { KnowledgeGraphLinkResolver, GraphConstraints } from "../src/graph/knowledge-graph-link-resolver";

describe("KnowledgeGraphLinkResolver", () => {
  it("should correctly resolve a simple direct link", () => {
    const constraints: GraphConstraints = {
      entityTypeCompatibility: new Map(),
      temporalWindowMs: 1000,
      knownRelationships: new Map(),
    };
    const resolver = new KnowledgeGraphLinkResolver(constraints);
    const link = resolver.resolveLink("entityA", "entityB", "ASSOCIATED_WITH", 0.9);
    expect(link).toEqual({
      source: "entityA",
      target: "entityB",
      type: "ASSOCIATED_WITH",
      confidence: 0.9,
    });
  });

  it("should handle a link with low confidence", () => {
    const constraints: GraphConstraints = {
      entityTypeCompatibility: new Map(),
      temporalWindowMs: 1000,
      knownRelationships: new Map(),
    };
    const resolver = new KnowledgeGraphLinkResolver(constraints);
    const link = resolver.resolveLink("entityX", "entityY", "UNKNOWN", 0.3);
    expect(link).toEqual({
      source: "entityX",
      target: "entityY",
      type: "UNKNOWN",
      confidence: 0.3,
    });
  });

  it("should return a link with the specified type", () => {
    const constraints: GraphConstraints = {
      entityTypeCompatibility: new Map(),
      temporalWindowMs: 1000,
      knownRelationships: new Map(),
    };
    const resolver = new KnowledgeGraphLinkResolver(constraints);
    const link = resolver.resolveLink("entityStart", "entityEnd", "CAUSED_BY", 1.0);
    expect(link).toEqual({
      source: "entityStart",
      target: "entityEnd",
      type: "CAUSED_BY",
      confidence: 1.0,
    });
  });
});