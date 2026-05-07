import { setTimeout } from 'node:timers/promises';

export type TaskStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";

export interface TaskDefinition {
    pollingIntervalMs: number;
    completionCondition: (data: Record<string, unknown>) => boolean;
    webhookEndpoint?: string;
    initialState: Record<string, unknown>;
}

export interface AsyncTask {
    taskId: string;
    status: TaskStatus;
    definition: TaskDefinition;
    currentData: Record<string, unknown>;
    createdAt: Date;
    lastUpdated: Date;
}

export class AsyncTaskOrchestrator {
    private tasks: Map<string, AsyncTask>;

    constructor() {
        this.tasks = new Map<string, AsyncTask>();
    }

    startTask(definition: TaskDefinition): string {
        const taskId = crypto.randomUUID();
        const newTask: AsyncTask = {
            taskId: taskId,
            status: "PENDING",
            definition: definition,
            currentData: definition.initialState,
            createdAt: new Date(),
            lastUpdated: new Date(),
        };
        this.tasks.set(taskId, newTask);
        return taskId;
    }

    getTaskStatus(taskId: string): TaskStatus | undefined {
        const task = this.tasks.get(taskId);
        return task ? task.status : undefined;
    }

    async pollTaskStatus(taskId: string): Promise<{ status: TaskStatus; data: Record<string, unknown>; nextAction: Promise<void> | null }> {
        const task = this.tasks.get(taskId);

        if (!task) {
            throw new Error(`Task ID ${taskId} not found.`);
        }

        if (task.status === "COMPLETE" || task.status === "FAILED") {
            return { status: task.status, data: task.currentData, nextAction: null };
        }

        if (task.status === "PENDING") {
            task.status = "RUNNING";
            this.tasks.set(taskId, task);
        }

        const definition = task.definition;
        const data = task.currentData;

        if (definition.completionCondition(data)) {
            task.status = "COMPLETE";
            this.tasks.set(taskId, task);
            return { status: "COMPLETE", data: data, nextAction: null };
        }

        if (definition.webhookEndpoint) {
            // Simulate external webhook trigger logic
            console.log(`[Orchestrator] Task ${taskId} requires external webhook trigger at ${definition.webhookEndpoint}. Waiting...`);
            // In a real system, this would involve setting up a listener or callback.
        }

        // Polling logic
        await setTimeout(definition.pollingIntervalMs);

        // Simulate updating data based on polling (e.g., fetching from a status API)
        const updatedData: Record<string, unknown> = {
            ...data,
            progress: (data.progress || 0) + 1,
            lastChecked: new Date().toISOString(),
        };
        task.currentData = updatedData;
        task.lastUpdated = new Date();
        this.tasks.set(taskId, task);

        return { status: "RUNNING", data: updatedData, nextAction: null };
    }
}

export { AsyncTaskOrchestrator };