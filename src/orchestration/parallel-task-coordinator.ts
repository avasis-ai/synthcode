import { EventEmitter } from 'node:events';

export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };
export type ContentBlock = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "thinking"; thinking: string };

export interface TaskResourceNeeds {
    cpu: number;
    memory: number;
    timeMs: number;
}

export interface ToolCall {
    toolName: string;
    toolInput: Record<string, unknown>;
    resourceNeeds: TaskResourceNeeds;
}

interface TaskResult {
    toolName: string;
    success: boolean;
    resultContent: string;
    metrics: {
        cpuUsed: number;
        memoryUsed: number;
        timeTakenMs: number;
    };
}

class ResourceReservationManager {
    private availableResources: { cpu: number; memory: number; time: number };

    constructor(initialResources: { cpu: number; memory: number; time: number }) {
        this.availableResources = initialResources;
    }

    canAllocate(needs: TaskResourceNeeds): boolean {
        return (
            needs.cpu <= this.availableResources.cpu &&
            needs.memory <= this.availableResources.memory &&
            needs.timeMs <= this.availableResources.time
        );
    }

    reserve(needs: TaskResourceNeeds): boolean {
        if (!this.canAllocate(needs)) {
            return false;
        }
        this.availableResources.cpu -= needs.cpu;
        this.availableResources.memory -= needs.memory;
        this.availableResources.time -= needs.timeMs;
        return true;
    }

    release(needs: TaskResourceNeeds): void {
        this.availableResources.cpu += needs.cpu;
        this.availableResources.memory += needs.memory;
        this.availableResources.time += needs.timeMs;
    }

    getAvailable(): { cpu: number; memory: number; time: number } {
        return { ...this.availableResources };
    }
}

export class ParallelTaskCoordinator {
    private resourceManager: ResourceReservationManager;

    constructor(resourceManager: ResourceReservationManager) {
        this.resourceManager = resourceManager;
    }

    private async executeTask(call: ToolCall): Promise<TaskResult> {
        const { toolName, toolInput, resourceNeeds } = call;

        if (!this.resourceManager.reserve(resourceNeeds)) {
            throw new Error(`Resource contention detected for tool ${toolName}. Cannot execute.`);
        }

        try {
            // Simulate asynchronous tool execution
            await new Promise(resolve => setTimeout(resolve, resourceNeeds.timeMs));

            // Simulate tool execution logic
            const resultContent = `[Result for ${toolName}]: Processed input ${JSON.stringify(toolInput)}.`;

            return {
                toolName: toolName,
                success: true,
                resultContent: resultContent,
                metrics: {
                    cpuUsed: resourceNeeds.cpu,
                    memoryUsed: resourceNeeds.memory,
                    timeTakenMs: resourceNeeds.timeMs,
                }
            };
        } catch (error) {
            return {
                toolName: toolName,
                success: false,
                resultContent: `Error executing ${toolName}: ${(error as Error).message}`,
                metrics: {
                    cpuUsed: resourceNeeds.cpu,
                    memoryUsed: resourceNeeds.memory,
                    timeTakenMs: resourceNeeds.timeMs,
                }
            };
        } finally {
            // Ensure resources are released regardless of success or failure
            this.resourceManager.release(resourceNeeds);
        }
    }

    public async coordinate(calls: ToolCall[]): Promise<{ results: TaskResult[]; combinedMetrics: { cpu: number; memory: number; time: number }; failedCalls: string[] }> {
        const executionPromises = calls.map(call => this.executeTask(call));

        const settledResults = await Promise.allSettled(executionPromises);

        const successfulResults: TaskResult[] = [];
        const failedCalls: string[] = [];
        let totalMetrics = { cpu: 0, memory: 0, time: 0 };

        for (const result of settledResults) {
            if (result.status === 'fulfilled') {
                const taskResult = result.value;
                successfulResults.push(taskResult);
                totalMetrics.cpu += taskResult.metrics.cpuUsed;
                totalMetrics.memory += taskResult.metrics.memoryUsed;
                totalMetrics.time += taskResult.metrics.timeTakenMs;
            } else {
                // Handle rejection (e.g., resource contention failure)
                const reason = (result.reason as Error).message;
                failedCalls.push(reason);
            }
        }

        return {
            results: successfulResults,
            combinedMetrics: totalMetrics,
            failedCalls: failedCalls
        };
    }
}

export { ParallelTaskCoordinator, ResourceReservationManager };