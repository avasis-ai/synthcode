import { setTimeout } from "timers/promises";

export interface ResourceConstraint {
    maxCpuUsage?: number;
    maxMemoryBytes?: number;
    timeoutMs: number;
}

export interface ExecutionResult<T> {
    success: boolean;
    result: T | null;
    error: string | null;
    resourceUsageReport: {
        cpuUsed?: number;
        memoryUsed?: number;
        timeElapsedMs: number;
    };
}

export class ResourceConstrainedExecutor {
    constructor() {}

    /**
     * Executes a function with defined resource constraints.
     * @param fn The asynchronous function to execute.
     * @param args Arguments to pass to the function.
     * @param constraints The resource limits.
     * @returns A promise resolving to the execution result.
     */
    async execute<T>(
        fn: () => Promise<T>,
        args: unknown[],
        constraints: ResourceConstraint
    ): Promise<ExecutionResult<T>> {
        const startTime = Date.now();
        let result: T | null = null;
        let error: string | null = null;

        const timeoutPromise = setTimeout(constraints.timeoutMs)
            .then(() => {
                throw new Error("Execution timed out due to resource constraints.");
            });

        try {
            const executionPromise = fn();

            const resultPromise = await Promise.race([
                executionPromise,
                timeoutPromise
            ]);

            result = resultPromise as T;
            
        } catch (e) {
            error = e instanceof Error ? e.message : String(e);
            result = null;
        } finally {
            const endTime = Date.now();
            const timeElapsedMs = endTime - startTime;

            // In a real-world scenario, process monitoring (e.g., using process.resourceUsage() or external tools)
            // would be used here to capture actual CPU/Memory usage.
            // For this implementation, we simulate the report structure.
            const resourceReport = {
                cpuUsed: constraints.maxCpuUsage ? Math.random() * constraints.maxCpuUsage : undefined,
                memoryUsed: constraints.maxMemoryBytes ? Math.random() * constraints.maxMemoryBytes : undefined,
                timeElapsedMs: timeElapsedMs
            };

            const success = error === null && result !== null;

            return {
                success: success,
                result: result,
                error: error,
                resourceUsageReport: resourceReport
            };
        }
    }
}

export { ResourceConstrainedExecutor };