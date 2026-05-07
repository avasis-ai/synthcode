interface SimulationState {
    resources: Record<string, number>;
    data: Record<string, any>;
    metadata: Record<string, any>;
}

export interface PlanStep {
    id: string;
    type: "tool_call" | "logic_update" | "resource_check";
    data: {
        toolName?: string;
        toolInput?: Record<string, unknown>;
        logicAction?: "set" | "increment" | "decrement";
        logicKey?: string;
        resourceName?: string;
        resourceAmount?: number;
        value?: any;
    };
}

export interface SimulationResult {
    finalState: SimulationState;
    history: {
        stepId: string;
        stepType: PlanStep["type"];
        success: boolean;
        predictedOutput: any;
        stateBefore: SimulationState;
        stateAfter: SimulationState;
        conflict?: string;
    }[];
    conflicts: string[];
}

export class PlanSimulationEngine {
    private readonly initialPlan: PlanStep[];

    constructor(initialState: SimulationState, plan: PlanStep[]) {
        this.initialPlan = plan;
    }

    private checkResourceAvailability(state: SimulationState, resourceName: string, amount: number): { available: boolean; conflict?: string } {
        const current = state.resources[resourceName] || 0;
        if (current >= amount) {
            return { available: true };
        }
        return { available: false, conflict: `Insufficient resource: ${resourceName}. Needed ${amount}, available ${current}.` };
    }

    private applyResourceConsumption(state: SimulationState, resourceName: string, amount: number): SimulationState {
        return {
            ...state,
            resources: {
                ...state.resources,
                [resourceName]: (state.resources[resourceName] || 0) - amount
            }
        };
    }

    private executeStep(currentState: SimulationState, step: PlanStep): { newState: SimulationState; output: any; conflict?: string } {
        let newState = { ...currentState };
        let output: any = {};
        let conflict: string | undefined = undefined;

        switch (step.type) {
            case "resource_check":
                if (!step.data.resourceName || step.data.resourceAmount === undefined) {
                    return { newState: currentState, output: { success: false, message: "Missing resource data for check." }, conflict: "Missing resource data." };
                }
                const checkResult = this.checkResourceAvailability(currentState, step.data.resourceName, step.data.resourceAmount);
                output = { success: checkResult.available, message: checkResult.available ? "Resource available." : checkResult.conflict };
                if (!checkResult.available) {
                    conflict = checkResult.conflict;
                }
                break;

            case "tool_call":
                const { toolName, toolInput } = step.data;
                if (!toolName || toolInput === undefined) {
                    return { newState: currentState, output: { success: false, message: "Missing tool call data." }, conflict: "Missing tool name or input." };
                }
                // Simulate tool execution based on input
                output = {
                    success: true,
                    predictedOutput: {
                        status: "success",
                        result: `Simulated successful execution of ${toolName} with input: ${JSON.stringify(toolInput)}`
                    }
                };
                break;

            case "logic_update":
                const { logicKey, logicAction, value: newValue } = step.data;
                if (!logicKey || !logicAction) {
                    return { newState: currentState, output: { success: false, message: "Missing logic update data." }, conflict: "Missing logic key or action." };
                }

                let updatedState = { ...currentState };
                let success = true;

                switch (logicAction) {
                    case "set":
                        updatedState = {
                            ...updatedState,
                            data: {
                                ...updatedState.data,
                                [logicKey]: newValue
                            }
                        };
                        output = { success: true, message: `Set ${logicKey} to ${JSON.stringify(newValue)}` };
                        break;
                    case "increment":
                        const currentVal = (updatedState.data[logicKey] || 0) as number;
                        updatedState = {
                            ...updatedState,
                            data: {
                                ...updatedState.data,
                                [logicKey]: currentVal + 1
                            }
                        };
                        output = { success: true, message: `${logicKey} incremented to ${currentVal + 1}` };
                        break;
                    case "decrement":
                        const currentValDec = (updatedState.data[logicKey] || 0) as number;
                        updatedState = {
                            ...updatedState,
                            data: {
                                ...updatedState.data,
                                [logicKey]: Math.max(0, currentValDec - 1)
                            }
                        };
                        output = { success: true, message: `${logicKey} decremented to ${Math.max(0, currentValDec - 1)}` };
                        break;
                }
                newState = updatedState;
                break;
        }

        return { newState: newState, output: output, conflict: conflict };
    }

    public simulate(initialState: SimulationState): SimulationResult {
        let currentState = { ...initialState };
        const history: SimulationResult["history"] = [];
        const conflicts: string[] = [];

        for (const step of this.initialPlan) {
            const { newState: nextState, output, conflict: stepConflict } = this.executeStep(currentState, step);

            const stepHistoryEntry: SimulationResult["history"][number] = {
                stepId: step.id,
                stepType: step.type,
                success: !stepConflict,
                predictedOutput: output,
                stateBefore: { ...currentState },
                stateAfter: { ...nextState },
                conflict: stepConflict
            };

            history.push(stepHistoryEntry);

            if (stepConflict) {
                conflicts.push(stepConflict);
                // If a conflict occurs, we assume the state change is blocked/rolled back for subsequent steps
                // For simplicity, we keep the state as it was before the failing step.
                // In a real system, this might require complex rollback logic.
            } else {
                currentState = nextState;
            }
        }

        return {
            finalState: currentState,
            history: history,
            conflicts: conflicts
        };
    }
}

export { PlanSimulationEngine };