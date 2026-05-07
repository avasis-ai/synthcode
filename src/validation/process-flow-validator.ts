import { type Message } from "./types";

type StepType = "task" | "conditional" | "wait" | "end";

interface StepDefinition {
    type: StepType;
    inputs: string[];
    outputs: string[];
    config: Record<string, unknown>;
}

interface Connection {
    targetNodeId: string;
    condition?: string;
}

interface ProcessFlowDefinition {
    startNodeId: string;
    steps: Record<string, StepDefinition>;
    connections: Record<string, Connection[]>;
}

export class ProcessFlowValidator {
    private flow: ProcessFlowDefinition;

    constructor(flow: ProcessFlowDefinition) {
        this.flow = flow;
    }

    private validateSchema(flow: ProcessFlowDefinition): string | null {
        if (!flow.startNodeId || !flow.steps) {
            return "Flow definition must specify a startNodeId and steps.";
        }

        for (const nodeId in flow.steps) {
            const step = flow.steps[nodeId];
            if (!step.type || !['task', 'conditional', 'wait', 'end'].includes(step.type)) {
                return `Step ${nodeId} has an invalid type.`;
            }
        }
        return null;
    }

    private detectCycles(flow: ProcessFlowDefinition): string | null {
        const visited: Set<string> = new Set();
        const recursionStack: Set<string> = new Set();

        const dfs = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) {
                return true; // Cycle detected
            }
            if (visited.has(nodeId)) {
                return false; // Already processed, no cycle through this path
            }

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const connections = flow.connections[nodeId] || [];
            for (const connection of connections) {
                if (dfs(connection.targetNodeId)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        // Check connectivity starting from all nodes to ensure all paths are covered
        for (const nodeId in flow.steps) {
            if (!visited.has(nodeId)) {
                if (dfs(nodeId)) {
                    return "Circular dependency detected in the process flow.";
                }
            }
        }
        return null;
    }

    private validateInputsOutputs(flow: ProcessFlowDefinition): string | null {
        const allOutputs: Set<string> = new Set<string>();
        const allInputs: Set<string> = new Set<string>();

        // 1. Collect all outputs
        for (const nodeId in flow.steps) {
            const step = flow.steps[nodeId];
            step.outputs.forEach(output => allOutputs.add(output));
        }

        // 2. Check if every required input is provided by a preceding step's output
        for (const nodeId in flow.steps) {
            const step = flow.steps[nodeId];
            for (const requiredInput of step.inputs) {
                if (!allOutputs.has(requiredInput)) {
                    return `Step ${nodeId} requires input '${requiredInput}', but no preceding step produces this output.`;
                }
            }
        }

        // 3. Check for unused outputs (optional, but good practice)
        // This check is complex and usually requires knowing the full graph traversal,
        // so we focus on the critical dependency check (inputs must be outputs).

        return null;
    }

    validate(): { isValid: boolean; message: string } {
        // 1. Schema Validation
        const schemaError = this.validateSchema(this.flow);
        if (schemaError) {
            return { isValid: false, message: `Schema Error: ${schemaError}` };
        }

        // 2. Cycle Detection
        const cycleError = this.detectCycles(this.flow);
        if (cycleError) {
            return { isValid: false, message: `Structural Error: ${cycleError}` };
        }

        // 3. I/O Consistency
        const ioError = this.validateInputsOutputs(this.flow);
        if (ioError) {
            return { isValid: false, message: `Dependency Error: ${ioError}` };
        }

        return { isValid: true, message: "Process flow is structurally sound and logically consistent." };
    }
}