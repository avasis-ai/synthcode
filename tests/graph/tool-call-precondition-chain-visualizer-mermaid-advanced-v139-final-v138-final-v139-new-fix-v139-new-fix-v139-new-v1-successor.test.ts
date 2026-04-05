import { describe, it, expect } from "vitest";
import {
  PreconditionChainStep,
  // Assuming other necessary types are imported or available
} from "../types";
import {
  generateMermaidDiagram,
  // Assuming the function to test is exported from the feature file
} from "./graph/tool-call-precondition-chain-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor";

describe("generateMermaidDiagram", () => {
  it("should generate a basic linear chain diagram for actions", () => {
    const steps: PreconditionChainStep[] = [
      {
        type: "action";
        description: "Step 1: Initial action",
        next: [
          {
            type: "action";
            description: "Step 2: Next action",
            next: []
          }
        ]
      }
    ];
    const diagram = generateMermaidDiagram(steps);
    expect(diagram).toContain("graph TD");
    expect(diagram).toContain("A[Step 1: Initial action]");
    expect(diagram).toContain("B[Step 2: Next action]");
    expect(diagram).toContain("A --> B");
  });

  it("should generate a diagram with a simple condition branch", () => {
    const steps: PreconditionChainStep[] = [
      {
        type: "condition";
        condition: "Is user authenticated?",
        trueBranch: [
          {
            type: "action";
            description: "Proceed to main flow",
            next: []
          }
        ],
        falseBranch: [
          {
            type: "action";
            description: "Show login prompt",
            next: []
          }
        ]
      }
    ];
    const diagram = generateMermaidDiagram(steps);
    expect(diagram).toContain("Is user authenticated?");
    expect(diagram).toContain("A[Proceed to main flow]");
    expect(diagram).toContain("B[Show login prompt]");
    expect(diagram).toContain("Is user authenticated? -->|Yes| A");
    expect(diagram).toContain("Is user authenticated? -->|No| B");
  });

  it("should generate a diagram including a loop structure", () => {
    const steps: PreconditionChainStep[] = [
      {
        type: "action";
        description: "Start process",
        next: [
          {
            type: "loop_start";
            loopId: "data_fetch",
            body: [
              {
                type: "action";
                description: "Fetch data chunk",
                next: []
              }
            ],
            exitCondition: "All data fetched",
            next: [
              {
                type: "action";
                description: "Process complete",
                next: []
              }
            ]
          }
        ]
      }
    ];
    const diagram = generateMermaidDiagram(steps);
    expect(diagram).toContain("loop_start: data_fetch");
    expect(diagram).toContain("Fetch data chunk");
    expect(diagram).toContain("All data fetched");
    expect(diagram).toContain("Process complete");
  });
});