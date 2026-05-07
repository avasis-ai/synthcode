import { describe, it, expect } from "vitest";
import { PlanSimulationEngine, PlanStep } from "../src/simulation/plan-simulation-engine";

describe("PlanSimulationEngine", () => {
    it("should initialize with a valid initial state", () => {
        const initialState: SimulationState = {
            resources: { "energy": 100, "time": 0 },
            data: { "user_id": "test_user" },
            metadata: { "source": "test" },
        };
        const engine = new PlanSimulationEngine(initialState);
        expect(engine).toBeDefined();
        // Assuming the engine exposes a way to check the initial state or internal structure
        // For this test, we just ensure instantiation works.
    });

    it("should correctly process a simple tool_call step", () => {
        const initialState: SimulationState = {
            resources: { "energy": 50 },
            data: {},
            metadata: {},
        };
        const plan: PlanStep[] = [
            {
                id: "step1",
                type: "tool_call",
                data: { toolName: "api_call", toolInput: { endpoint: "/data", payload: "test" } },
            },
        ];
        const engine = new PlanSimulationEngine(initialState);
        const result = engine.simulate(plan);

        // Assuming simulation updates the state based on the tool call
        expect(result.finalState.data).toHaveProperty("api_call_result");
        expect(result.finalState.resources).toEqual({ "energy": 50 }); // State should ideally remain unchanged unless the tool call modifies it
    });

    it("should correctly process a logic_update step (increment)", () => {
        const initialState: SimulationState = {
            resources: { "score": 10 },
            data: {},
            metadata: {},
        };
        const plan: PlanStep[] = [
            {
                id: "step2",
                type: "logic_update",
                data: { logicAction: "increment", logicKey: "score" },
            },
        ];
        const engine = new PlanSimulationEngine(initialState);
        const result = engine.simulate(plan);

        // Check if the resource was incremented
        expect(result.finalState.resources.score).toBe(20);
    });
});