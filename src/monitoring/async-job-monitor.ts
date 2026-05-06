enum JobState {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    TIMEOUT = "TIMEOUT",
}

export interface JobContext {
    jobId: string;
    status: JobState;
    lastError: string | null;
    startTime: Date;
    maxDurationMs: number;
}

export interface JobResult {
    success: boolean;
    output: string;
    error?: string;
}

export interface AsyncJobMonitor {
    submitJob(jobName: string, input: Record<string, unknown>, maxDurationMs: number): Promise<string>;
    pollJobStatus(jobId: string): Promise<{ status: JobState; result?: JobResult; error?: string }>;
}

export class JobMonitor implements AsyncJobMonitor {
    private jobStore: Map<string, JobContext>;

    constructor() {
        this.jobStore = new Map<string, JobContext>();
    }

    private generateJobId(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    async submitJob(jobName: string, input: Record<string, unknown>, maxDurationMs: number): Promise<string> {
        const jobId = this.generateJobId();
        const context: JobContext = {
            jobId,
            status: JobState.PENDING,
            lastError: null,
            startTime: new Date(),
            maxDurationMs,
        };
        this.jobStore.set(jobId, context);

        console.log(`Job submitted: ${jobId} (${jobName})`);

        return jobId;
    }

    async pollJobStatus(jobId: string): Promise<{ status: JobState; result?: JobResult; error?: string }> {
        const context = this.jobStore.get(jobId);

        if (!context) {
            return { status: JobState.FAILED, error: "Job ID not found." };
        }

        const now = new Date();
        const elapsed = now.getTime() - context.startTime.getTime();

        if (elapsed > context.maxDurationMs) {
            this.updateJobState(jobId, JobState.TIMEOUT, "Job exceeded maximum allowed duration.");
            return { status: JobState.TIMEOUT, error: "Job timed out." };
        }

        if (context.status === JobState.COMPLETED || context.status === JobState.FAILED) {
            return { status: context.status, result: context.status === JobState.COMPLETED ? { success: true, output: "Job completed successfully." } : undefined, error: context.status === JobState.FAILED ? "Job failed." : undefined };
        }

        // Simulate external polling logic
        const simulatedStatus = Math.random();

        if (simulatedStatus < 0.1) {
            // Simulate failure
            this.updateJobState(jobId, JobState.FAILED, "External service reported an internal error.");
            return { status: JobState.FAILED, error: "External service failure." };
        } else if (simulatedStatus < 0.2) {
            // Simulate completion
            const result: JobResult = { success: true, output: `Processed data for ${context.jobId}.` };
            this.updateJobState(jobId, JobState.COMPLETED, null);
            return { status: JobState.COMPLETED, result };
        } else {
            // Simulate running
            this.updateJobState(jobId, JobState.RUNNING, null);
            return { status: JobState.RUNNING };
        }
    }

    private updateJobState(jobId: string, status: JobState, error: string | null): void {
        const context = this.jobStore.get(jobId);
        if (context) {
            this.jobStore.set(jobId, {
                ...context,
                status: status,
                lastError: error,
            });
        }
    }
}

export const asyncJobMonitor = new JobMonitor();