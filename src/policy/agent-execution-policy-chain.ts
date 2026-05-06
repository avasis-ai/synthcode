import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

type Context = {
    messages: Message[];
    // Add other context elements if necessary, e.g., state, session_id
};

interface Policy<T> {
    execute: (context: Context) => Promise<{ result: T; success: boolean; error?: Error }>;
}

class AgentExecutionPolicyChain {
    private policies: Policy<any>[] = [];

    addPolicy(policy: Policy<any>): void {
        this.policies.push(policy);
    }

    async execute(context: Context): Promise<{ result: any; success: boolean; executedPolicy: string }> {
        for (let i = 0; i < this.policies.length; i++) {
            const policy = this.policies[i];
            const policyName = policy.constructor.name;

            try {
                const executionResult = await policy.execute(context);

                if (executionResult.success) {
                    return {
                        result: executionResult.result,
                        success: true,
                        executedPolicy: policyName,
                    };
                } else {
                    // Policy failed gracefully (e.g., specific business logic failure)
                    console.warn(`Policy ${policyName} failed gracefully.`);
                }
            } catch (error) {
                // Policy failed critically (e.g., network error, runtime exception)
                console.error(`Policy ${policyName} failed critically:`, error);
            }
        }

        // If loop completes without success
        return {
            result: null,
            success: false,
            executedPolicy: "None",
        };
    }
}

export { AgentExecutionPolicyChain };