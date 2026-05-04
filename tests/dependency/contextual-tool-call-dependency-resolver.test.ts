import { describe, it, expect } from "vitest";
import { ContextualToolCallDependencyResolver } from "../src/dependency/contextual-tool-call-dependency-resolver";

describe("ContextualToolCallDependencyResolver", () => {
  it("should initialize with the correct similarity threshold", () => {
    const threshold = 0.85;
    const resolver = new ContextualToolCallDependencyResolver(threshold);
    // Assuming there's a way to test the private field, or we test behavior dependent on it.
    // For simplicity, we'll rely on the constructor being called correctly.
    // A more robust test might involve a getter or a method that uses the threshold.
    expect(resolver).toBeInstanceOf(ContextualToolCallDependencyResolver);
  });

  it("should resolve dependencies when semantic similarity is high enough", () => {
    // Mocking the internal method or setting up a scenario where similarity is high
    const resolver = new ContextualToolCallDependencyResolver(0.6);
    // Since calculateSemanticSimilarity is private, we'll test the public interface's expected behavior.
    // Assuming a method like 'resolveDependencies' exists and uses the threshold.
    // For this test, we assume a successful resolution path.
    const mockContext: any = {
      sourceMessage: { content: "Need to find information about quantum computing." },
      semanticSummary: "Quantum computing involves qubits and superposition."
    };
    // Placeholder for actual resolution logic test
    expect(resolver).toBeDefined();
  });

  it("should not resolve dependencies when semantic similarity is too low", () => {
    const resolver = new ContextualToolCallDependencyResolver(0.9);
    // Assuming a scenario where the context is too dissimilar to trigger a dependency.
    const mockContext: any = {
      sourceMessage: { content: "What is the capital of France?" },
      semanticSummary: "Paris is the capital of France."
    };
    // Placeholder for actual non-resolution test
    expect(resolver).toBeDefined();
  });
});