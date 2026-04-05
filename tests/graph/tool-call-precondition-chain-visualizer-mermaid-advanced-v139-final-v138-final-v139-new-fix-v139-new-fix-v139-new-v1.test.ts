import { describe, it, expect } from "vitest";
import { ToolCallPreconditionChainVisualizer } from "../src/graph/tool-call-precondition-chain-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1";

describe("ToolCallPreconditionChainVisualizer", () => {
  it("should generate a basic mermaid diagram for a single precondition step", () => {
    const chain: any = {
      steps: [{
        stepName: "Check User Status",
        condition: "User is active",
        successAction: "Proceed to next step",
        failureAction: "Ask user to reactivate account",
      }],
      initialGoal: "Determine if user can proceed with the request",
    };
    const visualizer = new ToolCallPreconditionChainVisualizer(chain);
    const mermaidDiagram = visualizer.generateMermaidDiagram();

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("A[Determine if user can proceed with the request]");
    expect(mermaidDiagram).toContain("A -->|User is active| B[Proceed to next step]");
    expect(mermaidDiagram).toContain("A -->|User is not active| C[Ask user to reactivate account]");
  });

  it("should generate a complex diagram for multiple sequential precondition steps", () => {
    const chain: any = {
      steps: [
        {
          stepName: "Check Permissions",
          condition: "User has 'admin' role",
          successAction: "Proceed to data retrieval",
          failureAction: "Show permission error message",
        },
        {
          stepName: "Check Data Availability",
          condition: "Data set is non-empty",
          successAction: "Generate report",
          failureAction: "Inform user about missing data",
        },
      ],
      initialGoal: "Validate all prerequisites before generating a report",
    };
    const visualizer = new ToolCallPreconditionChainVisualizer(chain);
    const mermaidDiagram = visualizer.generateMermaidDiagram();

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("A[Validate all prerequisites before generating a report]");
    expect(mermaidDiagram).toContain("A -->|User has 'admin' role| B[Proceed to data retrieval]");
    expect(mermaidDiagram).toContain("B -->|Data set is non-empty| C[Generate report]");
    expect(mermaidDiagram).toContain("A -->|User does not have 'admin' role| D[Show permission error message]");
  });

  it("should handle an empty precondition chain gracefully", () => {
    const chain: any = {
      steps: [],
      initialGoal: "No preconditions required",
    };
    const visualizer = new ToolCallPreconditionChainVisualizer(chain);
    const mermaidDiagram = visualizer.generateMermaidDiagram();

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("A[No preconditions required]");
    expect(mermaidDiagram).not.toContain("-->");
  });
});