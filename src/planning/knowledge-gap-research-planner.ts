import { KnowledgeGap } from "./knowledge-gap.js";
import { ResearchStep, ToolResult } from "./research-step.js";

export class KnowledgeGapResearchPlanner {
    private knowledgeGap: KnowledgeGap;

    constructor(knowledgeGap: KnowledgeGap) {
        this.knowledgeGap = knowledgeGap;
    }

    private generateInitialPlan(): ResearchStep[] {
        const gaps = this.knowledgeGap.gaps;
        if (!gaps || gaps.length === 0) {
            return [];
        }

        // Heuristic: Prioritize broad search, then specific queries.
        const steps: ResearchStep[] = [];

        // Step 1: Broad Web Search for general context
        steps.push({
            id: "step-1-web-search",
            toolName: "webfetchtool",
            input: {
                query: `Overview of ${gaps.join(', ')}`,
                limit: 5
            },
            priority: 1,
            description: "Gather initial context from the web."
        });

        // Step 2: Database Query for structured facts
        steps.push({
            id: "step-2-db-query",
            toolName: "databasequerytool",
            input: {
                query: `Structured facts regarding ${gaps[0]} and ${gaps[1]}`
            },
            priority: 2,
            description: "Query internal knowledge base for specific facts."
        });

        // Step 3: File Reading for documentation
        steps.push({
            id: "step-3-file-read",
            toolName: "file-readtool",
            input: {
                filePath: "./documentation/core_concepts.md"
            },
            priority: 3,
            description: "Review core documentation files."
        });

        return steps;
    }

    public plan(): ResearchStep[] {
        return this.generateInitialPlan();
    }

    public async executePlan(initialState: Record<string, any> = {}): Promise<{ finalState: Record<string, any>; refinedPlan: ResearchStep[] }> {
        let currentState = { ...initialState };
        let currentPlan = this.plan();
        let history: Record<string, any> = {};

        for (let i = 0; i < currentPlan.length; i++) {
            const step = currentPlan[i];
            console.log(`Executing Step ${i + 1}: ${step.id}`);

            // Simulate tool execution
            let toolResult: ToolResult;
            try {
                // In a real scenario, this would call the actual tool executor
                const toolExecutor = await this.callTool(step);
                toolResult = {
                    role: "tool",
                    tool_use_id: step.id,
                    content: toolExecutor,
                    is_error: false
                };
            } catch (error) {
                toolResult = {
                    role: "tool",
                    tool_use_id: step.id,
                    content: `Error executing tool: ${error.message}`,
                    is_error: true
                };
            }

            // Update state and history
            currentState = { ...currentState, [step.id]: toolResult.content };
            history[step.id] = toolResult.content;

            // --- Refinement Logic ---
            const refinement = this.refinePlan(step, toolResult.content, currentState);
            if (refinement) {
                console.log(`Refinement detected after ${step.id}. Adjusting plan.`);
                // Replace or append steps based on refinement
                currentPlan = this.mergeRefinement(currentPlan, refinement);
                // Restart loop or handle the new plan structure (simplified here by breaking and returning the new plan)
                break;
            }
        }

        return { finalState: currentState, refinedPlan: currentPlan };
    }

    private async callTool(step: ResearchStep): Promise<string> {
        // Mock tool execution based on toolName
        if (step.toolName === "webfetchtool") {
            return `[Web Search Result]: Found 3 key articles on ${step.input.query}. Key concept A is linked to B.`;
        }
        if (step.toolName === "databasequerytool") {
            return `[DB Result]: Fact 1: ${step.input.query.split('regarding')[0].trim()} was established in 2020. Fact 2: The primary mechanism is X.`;
        }
        if (step.toolName === "file-readtool") {
            return `[File Content]: The documentation states that the process requires three phases: Initialization, Execution, and Validation.`;
        }
        return "Tool execution failed or returned no data.";
    }

    private refinePlan(executedStep: ResearchStep, resultContent: string, currentState: Record<string, any>): string | null {
        // Simple heuristic: If the result mentions a specific missing concept not yet covered, add a new step.
        if (executedStep.toolName === "webfetchtool" && resultContent.includes("Key concept A")) {
            const missingConcept = "Key concept A";
            if (!Object.values(currentState).some(s => typeof s === 'string' && s.includes(missingConcept))) {
                return `Add a targeted database query for "${missingConcept}"`;
            }
        }
        return null;
    }

    private mergeRefinement(currentPlan: ResearchStep[], refinement: string): ResearchStep[] {
        const newStep: ResearchStep = {
            id: "step-refinement-target",
            toolName: "databasequerytool",
            input: {
                query: refinement
            },
            priority: 1,
            description: `Targeted research based on previous findings: ${refinement}`
        };
        return [...currentPlan, newStep];
    }
}