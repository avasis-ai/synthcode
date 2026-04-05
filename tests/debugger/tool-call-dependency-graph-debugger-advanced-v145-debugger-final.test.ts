import { describe, it, expect } from "vitest";
import { DebuggerContext, DebuggerContextFinal } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v145-debugger-final";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/debugger/types";

describe("ToolCallDependencyGraphDebuggerAdvancedV145DebuggerFinal", () => {
    it("should initialize context correctly", () => {
        const initialContext: DebuggerContextFinal = {
            history: [],
            currentGraph: new Map(),
            currentState: {},
            finalSnapshots: new Map(),
            executionHistory: [],
        };
        expect(initialContext.history).toEqual([]);
        expect(initialContext.currentGraph.size).toBe(0);
        expect(initialContext.finalSnapshots.size).toBe(0);
        expect(initialContext.executionHistory).toEqual([]);
    });

    it("should update graph dependencies when a tool use occurs", () => {
        const context: DebuggerContextFinal = {
            history: [
                {
                    role: "user",
                    content: {
                        blocks: [
                            { type: "text", content: "Use tool A and then tool B" }
                        ]
                    }
                }
            ],
            currentGraph: new Map([
                ["user_input", { dependencies: new Set(), dependents: new Set() }]
            ]),
            currentState: {},
            finalSnapshots: new Map(),
            executionHistory: [],
        };

        // Mocking the update logic for testing purposes
        const updateGraph = (context: DebuggerContextFinal, toolUse: ToolUseBlock) => {
            const graph = context.currentGraph;
            const toolId = toolUse.toolId;
            const dependencies = new Set<string>();
            toolUse.arguments.forEach(arg => {
                if (typeof arg === 'string') {
                    dependencies.add(arg);
                }
            });

            if (!graph.has(toolId)) {
                graph.set(toolId, { dependencies: new Set(), dependents: new Set(), toolUse: toolUse });
            }
            const node = graph.get(toolId)!;
            node.dependencies = new Set([...node.dependencies, ...dependencies]);
            node.dependents.add("user_input"); // Simplified dependency tracking for test
        };

        const mockToolUse: ToolUseBlock = {
            toolId: "toolA",
            arguments: ["dependency1", "dependency2"],
        };

        updateGraph(context, mockToolUse);

        const toolANode = context.currentGraph.get("toolA");
        expect(toolANode).toBeDefined();
        expect(toolANode!.dependencies).toEqual(new Set(["dependency1", "dependency2"]));
        expect(toolANode!.dependents).toContain("user_input");
    });

    it("should record execution history step", () => {
        const context: DebuggerContextFinal = {
            history: [],
            currentGraph: new Map(),
            currentState: {},
            finalSnapshots: new Map(),
            executionHistory: [],
        };

        // Mocking the history update logic
        const recordStep = (context: DebuggerContextFinal, step: number, contextData: any) => {
            context.executionHistory.push({ step: step, context: contextData });
        };

        recordStep(context, 1, { state: "processing", graph: context.currentGraph });

        expect(context.executionHistory.length).toBe(1);
        expect(context.executionHistory[0].step).toBe(1);
        expect(context.executionHistory[0].context).toEqual({ state: "processing", graph: context.currentGraph });
    });
});