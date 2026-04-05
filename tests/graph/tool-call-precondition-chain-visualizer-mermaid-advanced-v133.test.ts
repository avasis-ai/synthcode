import { describe, it, expect } from "vitest";
import { ToolCallPreconditionChainVisualizerMermaidAdvancedV133 } from "../src/graph/tool-call-precondition-chain-visualizer-mermaid-advanced-v133.js";

describe("ToolCallPreconditionChainVisualizerMermaidAdvancedV133", () => {
    it("should correctly visualize a simple linear chain of actions", () => {
        const visualizer = new ToolCallPreconditionChainVisualizerMermaidAdvancedV133();
        const chain = {
            startNodeId: "start",
            steps: [
                {
                    nodeId: "step1",
                    type: "action",
                    content: "Action A",
                    nextSteps: {
                        condition: {
                            nodeId: "condition1",
                            type: "condition",
                            content: "Check condition X",
                            nextSteps: {
                                action: {
                                    nodeId: "step2",
                                    type: "action",
                                    content: "Action B",
                                    nextSteps: null
                                }
                            }
                        }
                    }
                }
            ]
        };
        const mermaidCode = visualizer.visualize(chain);
        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("start --> step1");
        expect(mermaidCode).toContain("step1 --> condition1");
        expect(mermaidCode).toContain("condition1 -- Yes --> step2");
    });

    it("should handle a chain with a fallback path", () => {
        const visualizer = new ToolCallPreconditionChainVisualizerMermaidAdvancedV133();
        const chain = {
            startNodeId: "start",
            steps: [
                {
                    nodeId: "step1",
                    type: "action",
                    content: "Initial Action",
                    nextSteps: {
                        condition: {
                            nodeId: "condition1",
                            type: "condition",
                            content: "Check condition Y",
                            nextSteps: {
                                action: {
                                    nodeId: "step2",
                                    type: "action",
                                    content: "Success Action",
                                    nextSteps: null
                                },
                                fallback: {
                                    nodeId: "fallback1",
                                    type: "fallback",
                                    content: "Fallback Action",
                                    nextSteps: null
                                }
                            }
                        }
                    }
                }
            ]
        };
        const mermaidCode = visualizer.visualize(chain);
        expect(mermaidCode).toContain("condition1 -- Yes --> step2");
        expect(mermaidCode).toContain("condition1 -- No --> fallback1");
    });

    it("should generate correct mermaid syntax for complex branching", () => {
        const visualizer = new ToolCallPreconditionChainVisualizerMermaidAdvancedV133();
        const chain = {
            startNodeId: "start",
            steps: [
                {
                    nodeId: "start_node",
                    type: "action",
                    content: "Start",
                    nextSteps: {
                        condition: {
                            nodeId: "cond_A",
                            type: "condition",
                            content: "Is A true?",
                            nextSteps: {
                                action: {
                                    nodeId: "action_A_true",
                                    type: "action",
                                    content: "Execute A True Path",
                                    nextSteps: {
                                        fallback: {
                                            nodeId: "fallback_A",
                                            type: "fallback",
                                            content: "Fallback A",
                                            nextSteps: null
                                        }
                                    }
                                },
                                fallback: {
                                    nodeId: "action_A_false",
                                    type: "action",
                                    content: "Execute A False Path",
                                    nextSteps: null
                                }
                            }
                        }
                    }
                }
            ]
        };
        const mermaidCode = visualizer.visualize(chain);
        expect(mermaidCode).toContain("start_node --> cond_A");
        expect(mermaidCode).toContain("cond_A -- Yes --> action_A_true");
        expect(mermaidCode).toContain("cond_A -- No --> action_A_false");
        expect(mermaidCode).toContain("action_A_true --> fallback_A");
    });
});