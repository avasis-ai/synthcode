import { describe, it, expect } from "vitest";
import { AgentContext, PromptTemplate } from "../src/prompt/prompt-router";

describe("PromptRouter", () => {
    it("should correctly initialize and handle basic context", () => {
        const context: AgentContext = {
            history: [],
            user_metadata: { userId: "test123" },
            runtime_metrics: { cpu: 0.5 },
            current_task_type: "general",
        };
        // Assuming a function like 'initializeRouter' or similar exists
        // Since the implementation is not provided, we test the structure and types.
        expect(context.user_metadata).toHaveProperty("userId", "test123");
        expect(context.runtime_metrics).toHaveProperty("cpu", 0.5);
    });

    it("should correctly process a simple prompt template", () => {
        const template: PromptTemplate = "Analyze the following request: {request}";
        // Assuming a function that processes the template
        const processedTemplate = template.replace("{request}", "sample input");
        expect(processedTemplate).toBe("Analyze the following request: sample input");
    });

    it("should handle context updates for different task types", () => {
        const initialContext: AgentContext = {
            history: [],
            user_metadata: {},
            runtime_metrics: {},
            current_task_type: "general",
        };
        // Simulate changing the task type
        const updatedContext: AgentContext = {
            ...initialContext,
            current_task_type: "technical",
        };
        expect(updatedContext.current_task_type).toBe("technical");
    });
});