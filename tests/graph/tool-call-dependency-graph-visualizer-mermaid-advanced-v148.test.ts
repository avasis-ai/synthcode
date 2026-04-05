import { describe, it, expect } from "vitest";
import { generateMermaidGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v148";

describe("generateMermaidGraph", () => {
  it("should generate a basic graph structure with defined states", () => {
    const context = {
      messages: [],
      initialState: "start",
      transitions: [
        { from: "start", to: "process_A" },
        { from: "process_A", to: "end" },
      ],
      states: {
        start: { description: "Initial state" },
        process_A: { description: "Processing A" },
        end: { description: "Final state" },
      },
    };
    const mermaid = generateMermaidGraph(context);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("start[Initial state]");
    expect(mermaid).toContain("process_A[Processing A]");
    expect(mermaid).toContain("end[Final state]");
  });

  it("should include transitions with conditions and actions", () => {
    const context = {
      messages: [],
      initialState: "start",
      transitions: [
        { from: "start", to: "check_condition", condition: "user_input > 10", action: "validate" },
        { from: "check_condition", to: "success", condition: "true" },
        { from: "check_condition", to: "failure", condition: "false" },
      ],
      states: {
        start: { description: "Start" },
        check_condition: { description: "Check Input" },
        success: { description: "Success" },
        failure: { description: "Failure" },
      },
    };
    const mermaid = generateMermaidGraph(context);
    expect(mermaid).toContain("start -->|user_input > 10| validate(check_condition)");
    expect(mermaid).toContain("check_condition -->|true| success");
    expect(mermaid).toContain("check_condition -->|false| failure");
  });

  it("should handle a graph with multiple complex states and outputs", () => {
    const context = {
      messages: [],
      initialState: "start",
      transitions: [
        { from: "start", to: "step1" },
        { from: "step1", to: "step2", action: "call_tool_B" },
      ],
      states: {
        start: { description: "Start", outputs: ["output_1"] },
        step1: { description: "Step 1", outputs: ["output_2"] },
        step2: { description: "Step 2", outputs: ["final_output"] },
      },
    };
    const mermaid = generateMermaidGraph(context);
    expect(mermaid).toContain("start[Start]");
    expect(mermaid).toContain("step1[Step 1]");
    expect(mermaid).toContain("step2[Step 2]");
    expect(mermaid).toContain("start --> step1");
    expect(mermaid).toContain("step1 -->|call_tool_B| step2");
  });
});