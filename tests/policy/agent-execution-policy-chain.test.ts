import { describe, it, expect, vi } from "vitest";
import { AgentExecutionPolicyChain } from "../src/policy/agent-execution-policy-chain";

describe("AgentExecutionPolicyChain", () => {
    it("should execute policies sequentially and return the result of the last successful policy", async () => {
        const mockPolicy1 = {
            execute: async (context) => ({ result: "Result 1", success: true }),
        };
        const mockPolicy2 = {
            execute: async (context) => ({ result: "Result 2", success: true }),
        };

        const chain = new AgentExecutionPolicyChain();
        chain.addPolicy(mockPolicy1);
        chain.addPolicy(mockPolicy2);

        const result = await chain.execute({ messages: [] });

        expect(result).toBe("Result 2");
    });

    it("should stop execution and return the result if a policy fails", async () => {
        const mockPolicy1 = {
            execute: async (context) => ({ result: "Success 1", success: true }),
        };
        const mockPolicy2 = {
            execute: async (context) => ({ result: "Failure 2", success: false, error: new Error("Policy failed") }),
        };
        const mockPolicy3 = {
            execute: async (context) => ({ result: "Should not run", success: true }),
        };

        const chain = new AgentExecutionPolicyChain();
        chain.addPolicy(mockPolicy1);
        chain.addPolicy(mockPolicy2);
        chain.addPolicy(mockPolicy3);

        const result = await chain.execute({ messages: [] });

        expect(result).toBe("Failure 2");
    });

    it("should handle an empty policy chain gracefully", async () => {
        const chain = new AgentExecutionPolicyChain();

        const result = await chain.execute({ messages: [] });

        expect(result).toBeUndefined();
    });
});