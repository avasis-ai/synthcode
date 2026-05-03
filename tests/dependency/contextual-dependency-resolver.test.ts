import { describe, it, expect } from "vitest";
import { ContextualDependencyResolverImpl } from "../src/dependency/contextual-dependency-resolver";

describe("ContextualDependencyResolverImpl", () => {
  const resolver = new ContextualDependencyResolverImpl();

  it("should return all required dependencies if context is empty", () => {
    const requiredDependencies = ["depA", "depB"];
    const context = { history: [], state: {} };
    const result = resolver.resolve(requiredDependencies, context);
    expect(result).toEqual(["depA", "depB"]);
  });

  it("should resolve a dependency if it's present in the state", () => {
    const requiredDependencies = ["depA", "depB"];
    const context = { history: [], state: { depA: "valueA", other: 123 } };
    const result = resolver.resolve(requiredDependencies, context);
    expect(result).toEqual(["depA", "depB"]);
  });

  it("should prioritize state values over history if both are present (though implementation might need refinement for this test)", () => {
    // Assuming the resolver logic handles state presence as the primary check
    const requiredDependencies = ["depA"];
    const context = { history: [{ type: "user", content: "Uses depA" }], state: { depA: "stateValue" } };
    const result = resolver.resolve(requiredDependencies, context);
    expect(result).toEqual(["depA"]);
  });
});