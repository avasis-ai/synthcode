import { Goal, ExecutionStep, RefinementContext } from "./types";

export class GoalRefinementLoop {
    private readonly maxRetries: number;

    constructor(maxRetries: number = 3) {
        this.maxRetries = maxRetries;
    }

    /**
     * Executes the planning step within a refinement loop.
     * If the step fails or reports a deviation, it attempts to refine the goal
     * and retry the execution, up to maxRetries times.
     * @param initialGoal The starting objective.
     * @param executionStep The function representing the planning step to execute.
     * @returns The result of the successful execution step.
     * @throws Error if refinement fails or max retries are exceeded.
     */
    public async execute(
        initialGoal: Goal,
        executionStep: (goal: Goal, context: RefinementContext) => Promise<{ result: any; success: boolean; context: RefinementContext }>
    ): Promise<any> {
        let currentGoal: Goal = initialGoal;
        let attemptCount = 0;

        while (attemptCount < this.maxRetries) {
            try {
                const context: RefinementContext = {
                    currentGoal: currentGoal,
                    attemptCount: attemptCount,
                    deviationReport: null,
                    failureReason: null,
                };

                const result = await executionStep(currentGoal, context);

                if (result.success) {
                    return result.result;
                } else {
                    // Step failed or reported deviation
                    context.deviationReport = result.context.deviationReport;
                    context.failureReason = result.context.failureReason;
                    
                    if (!context.deviationReport && !context.failureReason) {
                        throw new Error("Execution step failed without providing a deviation report or reason.");
                    }

                    console.warn(`Attempt ${attemptCount + 1} failed. Initiating refinement.`);

                    if (attemptCount === this.maxRetries - 1) {
                        throw new Error("Goal refinement failed: Maximum retries reached.");
                    }

                    // Refine the goal using the dedicated service
                    currentGoal = await GoalRefiner.refineGoal(context);
                    console.log("Goal successfully refined. Retrying...");
                }
            } catch (error) {
                console.error(`Attempt ${attemptCount + 1} failed due to critical error:`, error);

                if (attemptCount === this.maxRetries - 1) {
                    throw new Error(`Goal refinement loop failed after ${this.maxRetries} attempts. Last error: ${error.message}`);
                }

                // Attempt refinement even on critical failure
                const context: RefinementContext = {
                    currentGoal: currentGoal,
                    attemptCount: attemptCount,
                    deviationReport: null,
                    failureReason: error instanceof Error ? error.message : String(error),
                };
                currentGoal = await GoalRefiner.refineGoal(context);
                console.log("Goal successfully refined after critical failure. Retrying...");
            }
            attemptCount++;
        }
        throw new Error("Exceeded maximum refinement attempts.");
    }
}

/**
 * Service responsible for taking a failure context and generating a revised, actionable goal.
 * In a real system, this would involve an LLM call with specific prompting.
 */
class GoalRefiner {
    /**
     * Generates a revised goal based on the failure context.
     * @param context The context of the failure.
     * @returns A promise resolving to the refined Goal.
     */
    public static async refineGoal(context: RefinementContext): Promise<Goal> {
        // Mock LLM call logic
        const refinementPrompt = `The current goal is "${context.currentGoal.content}". 
        The execution failed or deviated. Failure reason: ${context.failureReason || 'N/A'}. 
        Deviation report: ${context.deviationReport?.text || 'N/A'}. 
        Please generate a revised, actionable goal that addresses the failure while staying true to the original intent.`;

        console.log("--- Calling GoalRefiner (Mock LLM) ---");
        console.log("Prompt:", refinementPrompt);

        // Mock implementation: Assume the LLM returns a slightly modified goal
        await new Promise(resolve => setTimeout(resolve, 50)); 

        const refinedContent = `[REVISED GOAL] Based on the failure, the new objective is: "${context.currentGoal.content.replace("initial", "revised")}"`;

        return {
            id: `refined-${Date.now()}`,
            content: refinedContent,
            priority: 1,
        };
    }
}

export { GoalRefinementLoop, GoalRefiner };