import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./synth-code-types";

type PlanStatus = "PENDING" | "CONFIRMED" | "FAILED";

interface Plan {
    id: string;
    goal: string;
    initialStatus: PlanStatus;
}

type ValidationPredicate = (payload: Record<string, unknown>) => boolean;

interface ConfirmationTask {
    plan: Plan;
    requiredSource: string;
    condition: ValidationPredicate;
    onConfirm: (plan: Plan) => Promise<void>;
    onFail: (plan: Plan, reason: string) => Promise<void>;
}

interface ExternalPayload {
    source: string;
    data: Record<string, unknown>;
}

export class AsyncPlanConfirmationManager {
    private tasks: Map<string, ConfirmationTask> = new Map();
    private readonly pendingPlanIds: Set<string> = new Set();

    registerTask(task: ConfirmationTask): void {
        if (this.tasks.has(task.plan.id)) {
            throw new Error(`Task already registered for Plan ID: ${task.plan.id}`);
        }
        this.tasks.set(task.plan.id, task);
        this.pendingPlanIds.add(task.plan.id);
    }

    async handleExternalPayload(payload: ExternalPayload): Promise<void> {
        const confirmedPlanIds: string[] = [];
        const failedPlanIds: string[] = [];

        for (const [planId, task] of this.tasks.entries()) {
            if (planId !== payload.source) {
                continue;
            }

            if (task.plan.initialStatus !== "PENDING") {
                continue;
            }

            try {
                if (task.condition(payload.data)) {
                    await task.onConfirm(task.plan);
                    confirmedPlanIds.push(planId);
                } else {
                    await task.onFail(task.plan, "Payload received but failed validation condition.");
                    failedPlanIds.push(planId);
                }
            } catch (error) {
                await task.onFail(task.plan, `Execution error: ${(error as Error).message}`);
                failedPlanIds.push(planId);
            }
        }

        // Clean up confirmed/failed tasks
        for (const id of [...confirmedPlanIds, ...failedPlanIds]) {
            this.tasks.delete(id);
            this.pendingPlanIds.delete(id);
        }
    }

    getPendingPlanIds(): Set<string> {
        return new Set(this.pendingPlanIds);
    }
}