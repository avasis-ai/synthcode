import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface AgentContext {
    memory: Message[];
    state: Record<string, any>;
    resourceUsage: Record<string, number>;
    lastToolCallId: string | null;
}

interface SimulationContext {
    readonly initialContext: AgentContext;
    currentContext: AgentContext;
}

type SimulationStep = {
    toolName: string;
    input: Record<string, unknown>;
};

export class ExecutionSimulator {
    private initialContext: AgentContext;
    private simulationContext: SimulationContext;

    constructor(initialContext: AgentContext) {
        this.initialContext = initialContext;
        this.simulationContext = {
            initialContext: initialContext,
            currentContext: {
                ...initialContext,
                // Ensure immutability principle is followed by creating a deep copy if necessary,
                // but for simplicity in this scope, we assume shallow copy is sufficient for state objects.
            }
        };
    }

    private applyStep(context: AgentContext, step: SimulationStep): {
        newContext: AgentContext;
        report: {
            resourceCost: number;
            stateChanges: Record<string, any>;
            conflicts: string[];
        };
    } {
        const newContext: AgentContext = {
            ...context,
            memory: [...context.memory],
            state: { ...context.state },
            resourceUsage: { ...context.resourceUsage },
            lastToolCallId: context.lastToolCallId
        };

        const report: {
            resourceCost: number;
            stateChanges: Record<string, any>;
            conflicts: string[];
        } = {
            resourceCost: 0,
            stateChanges: {},
            conflicts: []
        };

        // --- Virtual Execution Logic ---

        // 1. Simulate Resource Usage
        const resourceCost = 10 + Object.keys(step.input).length * 2;
        report.resourceCost += resourceCost;

        // 2. Simulate State Transition
        const newState = { ...context.state };
        for (const key in step.input) {
            if (Object.prototype.hasOwnProperty.call(step.input, key)) {
                const value = step.input[key];
                // Simple state update simulation
                newState[`sim_${key}`] = value;
                report.stateChanges[`sim_${key}`] = value;
            }
        }

        // 3. Simulate Memory Update (Tool Call)
        const toolResultMessage: ToolResultMessage = {
            role: "tool",
            tool_use_id: `sim_id_${Date.now()}`,
            content: `Simulated successful execution of ${step.toolName}.`,
        };
        newContext.memory.push(toolResultMessage);

        // 4. Simulate Conflicts (Example: Overwriting critical state)
        if (newState.user_id === undefined && step.toolName === "critical_update") {
            report.conflicts.push("Attempted critical update without required user_id context.");
        }

        return {
            newContext: {
                ...newContext,
                state: newState,
                resourceUsage: {
                    ...context.resourceUsage,
                    total_sim_cost: (context.resourceUsage.total_sim_cost || 0) + resourceCost
                }
            },
            report: report
        };
    }

    simulate(steps: SimulationStep[]): {
        finalContext: AgentContext;
        report: {
            totalResourceCost: number;
            stateDiffs: Record<string, any>;
            conflicts: string[];
        };
    } {
        let current = this.simulationContext.currentContext;
        let accumulatedReport: {
            totalResourceCost: number;
            stateDiffs: Record<string, any>;
            conflicts: string[];
        } = {
            totalResourceCost: 0,
            stateDiffs: {},
            conflicts: []
        };

        for (const step of steps) {
            const { newContext, report } = this.applyStep(current, step);
            current = newContext;

            accumulatedReport.totalResourceCost += report.resourceCost;
            accumulatedReport.stateDiffs = { ...accumulatedReport.stateDiffs, ...report.stateChanges };
            accumulatedReport.conflicts = [...accumulatedReport.conflicts, ...report.conflicts];
        }

        return {
            finalContext: current,
            report: {
                totalResourceCost: accumulatedReport.totalResourceCost,
                stateDiffs: accumulatedReport.stateDiffs,
                conflicts: accumulatedReport.conflicts
            }
        };
    }

    generateReport(initialContext: AgentContext, finalContext: AgentContext, steps: SimulationStep[]): {
        stateDiffs: Record<string, any>;
        resourceCost: number;
        conflicts: string[];
    } {
        const stateDiffs: Record<string, any> = {};
        const conflicts: string[] = [];
        let totalResourceCost = 0;

        // Compare state changes
        for (const key in finalContext.state) {
            if (Object.prototype.hasOwnProperty.call(finalContext.state, key)) {
                const initialValue = initialContext.state[key];
                const finalValue = finalContext.state[key];

                if (JSON.stringify(initialValue) !== JSON.stringify(finalValue)) {
                    stateDiffs[key] = {
                        initial: initialValue,
                        predicted: finalValue
                    };
                }
            }
        }

        // Note: Since the simulation logic calculates resource cost incrementally,
        // we rely on the report generated during the simulation run for accuracy.
        // For this method signature, we assume the caller has access to the total cost.
        // We will return a placeholder cost or assume the cost was calculated during the simulation call.
        // For completeness, we'll assume the total cost is available from the final context.
        totalResourceCost = finalContext.resourceUsage.total_sim_cost || 0;

        return {
            stateDiffs: stateDiffs,
            resourceCost: totalResourceCost,
            conflicts: conflicts
        };
    }
}