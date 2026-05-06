interface UserMessage {
    role: "user";
    content: string;
}

interface AssistantMessage {
    role: "assistant";
    content: any[];
}

interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface TextBlock {
    type: "text";
    text: string;
}

interface ToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
}

interface ThinkingBlock {
    type: "thinking";
    thinking: string;
}

type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

type Context = Record<string, any>;

interface TransactionalStep {
    execute: (context: Context) => Promise<void>;
    rollback: (context: Context) => Promise<void>;
}

class TransactionalWorkflowEngine {
    private steps: TransactionalStep[];

    constructor(steps: TransactionalStep[]) {
        this.steps = steps;
    }

    async executeWorkflow(initialContext: Context): Promise<Context> {
        let context: Context = { ...initialContext };
        const successfulSteps: TransactionalStep[] = [];

        try {
            for (const step of this.steps) {
                await step.execute(context);
                successfulSteps.push(step);
            }
            return context;
        } catch (error) {
            console.error("Workflow failed. Initiating rollback.", error);
            await this.rollback(successfulSteps, context);
            throw new Error("Workflow execution failed and rolled back.");
        }
    }

    private async rollback(successfulSteps: TransactionalStep[], context: Context): Promise<void> {
        for (let i = successfulSteps.length - 1; i >= 0; i--) {
            const step = successfulSteps[i];
            try {
                await step.rollback(context);
            } catch (rollbackError) {
                console.error(`Critical: Failed to rollback step ${i}. Manual intervention required.`, rollbackError);
            }
        }
    }
}

export { TransactionalWorkflowEngine, TransactionalStep };