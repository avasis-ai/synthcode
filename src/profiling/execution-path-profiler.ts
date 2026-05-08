import { performance } from 'node:perf_hooks';

export type Message = { role: "user" | "assistant" | "tool"; content: any };
export type ContentBlock = any;

interface StepMetric {
    stepType: string;
    startTime: number;
    endTime: number;
    latencyMs: number;
    details: Record<string, unknown>;
}

interface PathMetrics {
    totalLatencyMs: number;
    steps: StepMetric[];
    resourceUsage: {
        memoryBytes: number;
        cpuTimeMs: number;
    };
}

export class PathProfiler {
    private metrics: PathMetrics = {
        totalLatencyMs: 0,
        steps: [],
        resourceUsage: {
            memoryBytes: 0,
            cpuTimeMs: 0,
        }
    };

    constructor() {}

    reset() {
        this.metrics = {
            totalLatencyMs: 0,
            steps: [],
            resourceUsage: {
                memoryBytes: 0,
                cpuTimeMs: 0,
            }
        };
    }

    recordStep(stepType: string, start: number, end: number, details: Record<string, unknown> = {}): void {
        const latencyMs = end - start;
        this.metrics.steps.push({
            stepType,
            startTime: start,
            endTime: end,
            latencyMs,
            details
        });
    }

    recordResourceUsage(memoryBytes: number, cpuTimeMs: number): void {
        this.metrics.resourceUsage.memoryBytes += memoryBytes;
        this.metrics.resourceUsage.cpuTimeMs += cpuTimeMs;
    }

    getMetrics(): PathMetrics {
        return { ...this.metrics };
    }
}

type ExecutionInterceptor = (context: any, next: () => Promise<any>) => Promise<any>;

export class PathProfilerInterceptor {
    private profiler: PathProfiler;

    constructor(profiler: PathProfiler) {
        this.profiler = profiler;
    }

    intercept(context: any, next: () => Promise<any>): Promise<any> {
        const startOverall = performance.now();

        return next().then(result => {
            const endOverall = performance.now();
            
            this.profiler.recordStep("overall_execution", startOverall, endOverall, {
                resultType: typeof result
            });

            return result;
        }).catch(error => {
            const endOverall = performance.now();
            this.profiler.recordStep("overall_execution", startOverall, endOverall, {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        });
    }
}

export class PathProfilerReporter {
    static generateReport(metrics: PathMetrics): string {
        let report = `--- Execution Path Profile Report ---\n`;
        report += `Total Latency: ${metrics.totalLatencyMs.toFixed(2)} ms\n`;
        report += `Total Resource Usage:\n`;
        report += `  Memory: ${(metrics.resourceUsage.memoryBytes / 1024).toFixed(2)} KB\n`;
        report += `  CPU Time: ${metrics.resourceUsage.cpuTimeMs.toFixed(2)} ms\n`;
        report += `\n--- Step Breakdown (${metrics.steps.length} steps) ---\n`;

        metrics.steps.forEach((step, index) => {
            report += `\n[Step ${index + 1}: ${step.stepType}]\n`;
            report += `  Duration: ${step.latencyMs.toFixed(2)} ms\n`;
            report += `  Details: ${JSON.stringify(step.details, null, 2)}\n`;
        });

        report += "\n--------------------------------------\n";
        return report;
    }
}

export { PathProfiler, PathProfilerInterceptor, PathProfilerReporter };