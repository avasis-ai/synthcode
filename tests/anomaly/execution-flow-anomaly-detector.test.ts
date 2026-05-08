import { describe, it, expect } from "vitest";
import {
    AnomalyDetector,
    ExecutionContext,
    FlowRule,
    ExecutionStep,
} from "../src/anomaly/execution-flow-anomaly-detector";

describe("AnomalyDetector", () => {
    it("should detect an anomaly when a step violates the required preceding step type", async () => {
        const context: ExecutionContext = {
            history: [
                { type: "message", data: { content: "Initial message" }, timestamp: 100 },
            ],
            lastStepTimestamp: 100,
        };

        const rule: FlowRule = {
            id: "rule1",
            description: "Tool call must follow a message",
            requiredPrecedingStepType: "message",
        };

        const nextStep: ExecutionStep = {
            type: "tool_call",
            data: { tool: "search" },
            timestamp: 200,
        };

        const detector = new AnomalyDetector();
        const anomaly = detector.detectAnomaly(context, rule, nextStep);

        expect(anomaly).toBeDefined();
        expect(anomaly?.reason).toContain("required preceding step type");
    });

    it("should not detect an anomaly when a step follows a valid preceding step type", async () => {
        const context: ExecutionContext = {
            history: [
                { type: "tool_call", data: { tool: "search" }, timestamp: 100 },
            ],
            lastStepTimestamp: 100,
        };

        const rule: FlowRule = {
            id: "rule2",
            description: "Message must follow a tool call",
            requiredPrecedingStepType: "tool_call",
        };

        const nextStep: ExecutionStep = {
            type: "message",
            data: { content: "Response message" },
            timestamp: 200,
        };

        const detector = new AnomalyDetector();
        const anomaly = detector.detectAnomaly(context, rule, nextStep);

        expect(anomaly).toBeUndefined();
    });

    it("should detect an anomaly when a step violates the required preceding step name", async () => {
        const context: ExecutionContext = {
            history: [
                { type: "tool_call", data: { tool: "search" }, timestamp: 100 },
            ],
            lastStepTimestamp: 100,
        };

        const rule: FlowRule = {
            id: "rule3",
            description: "Next step must follow 'search' tool call",
            requiredPrecedingStepName: "search",
        };

        const nextStep: ExecutionStep = {
            type: "tool_call",
            data: { tool: "write" },
            timestamp: 200,
        };

        const detector = new AnomalyDetector();
        const anomaly = detector.detectAnomaly(context, rule, nextStep);

        expect(anomaly).toBeDefined();
        expect(anomaly?.reason).toContain("required preceding step name");
    });
});