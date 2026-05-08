export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent = any;

interface StepMetrics {
  name: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  // Could add resource usage metrics here if available (e.g., memory peak)
}

export interface ProfilerReport {
  totalDurationMs: number;
  steps: StepMetrics[];
  averageStepDurationMs: number;
  slowestStepName: string | null;
  slowestStepDurationMs: number;
}

export class ExecutionProfiler {
  private metrics: StepMetrics[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = performance.now();
  }

  private recordStep(name: string, start: number, end: number): void {
    const durationMs = end - start;
    this.metrics.push({
      name,
      startTime: start,
      endTime: end,
      durationMs,
    });
  }

  /**
   * Executes the provided asynchronous function and measures its duration,
   * recording the metrics under the given step name.
   * @param stepName The name of the step being profiled.
   * @param fn The asynchronous function to execute.
   * @returns The result of the function execution.
   */
  public async withProfiler<T>(stepName: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      this.recordStep(stepName, start, end);
      return result;
    } catch (error) {
      const end = performance.now();
      this.recordStep(stepName, start, end);
      throw error;
    }
  }

  /**
   * Generates a comprehensive performance report based on collected metrics.
   */
  public generateReport(): ProfilerReport {
    const totalDurationMs = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].endTime - this.metrics[0].startTime : 0;
    const totalSteps = this.metrics.length;

    let totalDurationSum = 0;
    let slowestStepName: string | null = null;
    let slowestStepDurationMs: number = 0;

    for (const metric of this.metrics) {
      totalDurationSum += metric.durationMs;
      if (metric.durationMs > slowestStepDurationMs) {
        slowestStepDurationMs = metric.durationMs;
        slowestStepName = metric.name;
      }
    }

    const averageStepDurationMs = totalSteps > 0 ? totalDurationSum / totalSteps : 0;

    return {
      totalDurationMs: Math.round(totalDurationMs),
      steps: this.metrics,
      averageStepDurationMs: Math.round(averageStepDurationMs),
      slowestStepName: slowestStepName,
      slowestStepDurationMs: Math.round(slowestStepDurationMs),
    };
  }

  /**
   * Clears all recorded metrics and resets the profiler state.
   */
  public reset(): void {
    this.metrics = [];
    this.startTime = performance.now();
  }
}

export { ExecutionProfiler };