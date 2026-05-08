import { describe, it, expect } from "vitest"
import { TemporalObservationGate, Observation } from "../src/gate/temporal-observation-gate"

describe("TemporalObservationGate", () => {
    it("should initialize correctly and allow observation when criteria are met", () => {
        const gate = new TemporalObservationGate(["typeA", "typeB"], 2, 1000)
        const obs1: Observation = { type: "typeA", data: 1, timestamp: Date.now() };
        const obs2: Observation = { type: "typeB", data: 2, timestamp: Date.now() + 10 };
        const obs3: Observation = { type: "typeA", data: 3, timestamp: Date.now() + 20 };

        // Initial state check (should be closed)
        expect(gate.isGateOpen()).toBe(false);

        // Add observations
        gate.observe(obs1);
        expect(gate.isGateOpen()).toBe(false);

        gate.observe(obs2);
        // Now count is 2, types are A and B. Criteria met.
        expect(gate.isGateOpen()).toBe(true);
    })

    it("should remain closed if the minimum count is not reached", () => {
        const gate = new TemporalObservationGate(["typeA"], 3, 1000)
        const obs1: Observation = { type: "typeA", data: 1, timestamp: Date.now() };
        const obs2: Observation = { type: "typeA", data: 2, timestamp: Date.now() + 10 };

        gate.observe(obs1);
        expect(gate.isGateOpen()).toBe(false);

        gate.observe(obs2);
        expect(gate.isGateOpen()).toBe(false);
    })

    it("should close the gate if observations are too old", () => {
        const gate = new TemporalObservationGate(["typeA"], 1, 50)
        const obs1: Observation = { type: "typeA", data: 1, timestamp: Date.now() };

        // Open the gate initially
        gate.observe(obs1);
        expect(gate.isGateOpen()).toBe(true);

        // Wait for time window to pass
        const oldObs: Observation = { type: "typeA", data: 2, timestamp: Date.now() - 100 };
        gate.observe(oldObs);

        // Gate should close due to timeout
        expect(gate.isGateOpen()).toBe(false);
    })
})