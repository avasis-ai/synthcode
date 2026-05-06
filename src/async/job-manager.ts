import { EventEmitter } from "node:events";

type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

interface TaskDefinition {
  taskName: string;
  payload: Record<string, unknown>;
}

interface Job {
  jobId: string;
  status: JobStatus;
  submittedAt: Date;
  poll: (jobId: string) => Promise<{ status: JobStatus; result?: any; error?: string }>;
}

export class AsyncJobManager extends EventEmitter {
  private jobs: Map<string, Job> = new Map();

  constructor() {
    super();
  }

  /**
   * Simulates submitting a job to an external asynchronous service.
   * @param taskDefinition The definition of the task to run.
   * @returns A promise resolving to the newly created Job ID.
   */
  public async submitJob(taskDefinition: TaskDefinition): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const initialJob: Job = {
      jobId: jobId,
      status: "PENDING",
      submittedAt: new Date(),
      poll: this.createPollingFunction(jobId, taskDefinition.taskName),
    };

    this.jobs.set(jobId, initialJob);

    console.log(`[JobManager] Job submitted successfully. ID: ${jobId}`);
    return jobId;
  }

  /**
   * Internal function to create a job polling mechanism.
   * In a real system, this would involve an HTTP client call to the external service.
   */
  private createPollingFunction(jobId: string, taskName: string): (jobId: string) => Promise<{ status: JobStatus; result?: any; error?: string }> {
    return async (id: string): Promise<{ status: JobStatus; result?: any; error?: string }> => {
      const job = this.jobs.get(id);
      if (!job) {
        return { status: "FAILED", error: "Job not found." };
      }

      // Simulate external service polling logic
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network latency

      const currentStatus = job.status;

      if (currentStatus === "PENDING") {
        // Simulate transition to RUNNING after first poll
        this.jobs.set(id, { ...job, status: "RUNNING" });
        return { status: "RUNNING" };
      }

      if (currentStatus === "RUNNING") {
        // Simulate completion after a few polls
        const pollCount = this.jobs.get(id)?.pollCount || 0;
        if (pollCount >= 3) {
          const result = { data: `Processed data for ${taskName}` };
          this.jobs.set(id, { ...job, status: "COMPLETED" });
          return { status: "COMPLETED", result };
        }
        this.jobs.set(id, { ...job, pollCount: pollCount + 1 });
        return { status: "RUNNING" };
      }

      return { status: currentStatus };
    };
  }

  /**
   * Polls the status of a submitted job.
   * @param jobId The ID of the job to check.
   * @returns A promise resolving to the job result if complete, or throwing an error if polling is required.
   * @throws {Error} If the job is not found or if polling is necessary.
   */
  public async pollJob(jobId: string): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ID ${jobId} not found.`);
    }

    const pollResult = await job.poll(jobId);

    if (pollResult.status === "COMPLETED") {
      return pollResult.result;
    }

    if (pollResult.status === "FAILED") {
      throw new Error(`Job ${jobId} failed: ${pollResult.error}`);
    }

    if (pollResult.status === "PENDING" || pollResult.status === "RUNNING") {
      throw new Error(`Job ${jobId} is still ${pollResult.status}. Please poll again later.`);
    }

    throw new Error(`Unknown job status received for ${jobId}.`);
  }
}