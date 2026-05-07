import { Message } from "./types";

type PolicyValidator = (context: Message) => Promise<{ success: boolean; message: string }>;

export class PolicyChainExecutor {
    private policies: PolicyValidator[];
    private failFast: boolean;

    constructor(policies: PolicyValidator[], failFast: boolean = true) {
        if (!policies || policies.length === 0) {
            throw new Error("PolicyChainExecutor requires at least one policy validator.");
        }
        this.policies = policies;
        this.failFast = failFast;
    }

    /**
     * Executes the chain of policies against the given context message.
     * @param context The current message context for policy evaluation.
     * @returns A promise resolving to an object containing the overall success status and individual policy results.
     */
    async execute(context: Message): Promise<{ success: boolean; results: { success: boolean; message: string }[] }> {
        const results: { success: boolean; message: string }[] = [];
        let overallSuccess = true;

        for (const policy of this.policies) {
            if (!this.failFast && !overallSuccess) {
                // If not fail-fast, we continue executing even if a previous policy failed.
            } else if (this.failFast && !overallSuccess) {
                // Short-circuiting: stop execution immediately upon failure.
                break;
            }

            try {
                const result = await policy(context);
                results.push({ success: result.success, message: result.message });

                if (!result.success) {
                    overallSuccess = false;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown policy execution error";
                results.push({ success: false, message: `Execution failed: ${errorMessage}` });
                overallSuccess = false;
                if (this.failFast) {
                    break;
                }
            }
        }

        return { success: overallSuccess, results };
    }

    /**
     * Creates a new executor instance configured to fail fast (default behavior).
     * @param policies The list of policies to run.
     */
    static createFailFast(policies: PolicyValidator[]): PolicyChainExecutor {
        return new PolicyChainExecutor(policies, true);
    }

    /**
     * Creates a new executor instance configured to run all policies regardless of failure.
     * @param policies The list of policies to run.
     */
    static createNonFailFast(policies: PolicyValidator[]): PolicyChainExecutor {
        return new PolicyChainExecutor(policies, false);
    }
}