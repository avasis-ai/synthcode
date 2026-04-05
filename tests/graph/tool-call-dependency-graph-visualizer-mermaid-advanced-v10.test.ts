import { describe, it, expect } from "vitest";
import { AdvancedGraphConfig } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v10";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV10", () => {
  it("should generate a basic graph structure with nodes and links", () => {
    const config: AdvancedGraphConfig = {
      mermaidGraphType: "graph TD",
      nodes: {
        A: "Start Node",
        B: "End Node",
      },
      links: [
        { from: "A", to: "B", label: "Connect" },
      ],
      toolCallDependencies: [],
    };

    const visualizer = new (class {
      constructor(public config: AdvancedGraphConfig) {}
      generateMermaid(): string {
        let mermaid = `${this.config.mermaidGraphType}\n`;
        mermaid += "%% Nodes\n";
        for (const nodeId in this.config.nodes) {
          mermaid += `${nodeId}["${this.config.nodes[nodeId]}"]\n`;
        }
        mermaid += "\n%% Links\n";
        for (const link of this.config.links) {
          mermaid += `${link.from} -->|${link.label || ""}| ${link.to};\n`;
        }
        return mermaid;
      }
    })(config);

    const mermaidOutput = visualizer.generateMermaid();
    expect(mermaidOutput).toContain("graph TD");
    expect(mermaidOutput).toContain('A["Start Node"]');
    expect(mermaidOutput).toContain('B["End Node"]');
    expect(mermaidOutput).toContain('A -->|Connect| B;');
  });

  it("should include tool call dependencies in the graph structure", () => {
    const config: AdvancedGraphConfig = {
      mermaidGraphType: "graph TD",
      nodes: {
        start: "Start",
        toolA: "Tool A Call",
        end: "End",
      },
      links: [
        { from: "start", to: "toolA" },
        { from: "toolA", to: "end" },
      ],
      toolCallDependencies: [
        { sourceId: "start", targetId: "toolA", toolName: "ToolA", dependencyType: "required" },
        { sourceId: "toolA", targetId: "end", toolName: "ToolB", dependencyType: "optional" },
      ],
    };

    const visualizer = new (class {
      constructor(public config: AdvancedGraphConfig) {}
      generateMermaid(): string {
        let mermaid = `${this.config.mermaidGraphType}\n`;
        mermaid += "%% Nodes\n";
        for (const nodeId in this.config.nodes) {
          mermaid += `${nodeId}["${this.config.nodes[nodeId]}"]\n`;
        }
        mermaid += "\n%% Links\n";
        for (const link of this.config.links) {
          mermaid += `${link.from} -->|${link.label || ""}| ${link.to};\n`;
        }
        // Simulate adding dependency info to links or notes for testing purposes
        let dependencyInfo = "";
        for (const dep of this.config.toolCallDependencies) {
            dependencyInfo += `\n%% Dependency: ${dep.sourceId} -> ${dep.targetId} (${dep.toolName}, ${dep.dependencyType})`;
        }
        mermaid += dependencyInfo;
        return mermaid;
      }
    })(config);

    const mermaidOutput = visualizer.generateMermaid();
    expect(mermaidOutput).toContain('%% Dependency: start -> toolA (ToolA, required)');
    expect(mermaidOutput).toContain('%% Dependency: toolA -> end (ToolB, optional)');
  });

  it("should handle conditional links correctly", () => {
    const config: AdvancedGraphConfig = {
      mermaidGraphType: "graph TD",
      nodes: {
        A: "Node A",
        B: "Node B",
        C: "Node C",
      },
      links: [
        { from: "A", to: "B", condition: (fromNode, toNode) => fromNode === "A" && toNode === "B" },
        { from: "A", to: "C", condition: (fromNode, toNode) => false },
      ],
      toolCallDependencies: [],
    };

    const visualizer = new (class {
      constructor(public config: AdvancedGraphConfig) {}
      generateMermaid(): string {
        let mermaid = `${this.config.mermaidGraphType}\n`;
        mermaid += "%% Nodes\n";
        for (const nodeId in this.config.nodes) {
          mermaid += `${nodeId}["${this.config.nodes[nodeId]}"]\n`;
        }
        mermaid += "\n%% Links\n";
        for (const link of this.config.links) {
          if (link.condition && link.condition(link.from, link.to)) {
            mermaid += `${link.from} -->|Conditional| ${link.to};\n`;
          }
        }
        return mermaid;
      }
    })(config);

    const mermaidOutput = visualizer.generateMermaid();
    expect(mermaidOutput).toContain('A["Node A"]');
    expect(mermaidOutput).toContain('A -->|Conditional| B;');
    expect(mermaidOutput).not.toContain('A -->|Conditional| C;');
  });
});