import { EventEmitter } from "node:events";

export type TaskID = string;
export type TaskStatus = "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";

export interface TaskResult {
  status: TaskStatus;
  result?: any;
  error?: string;
}

export interface TaskQueueClient {
  submitTask(payload: any): Promise<TaskID>;
  pollTask(taskID: TaskID): Promise<TaskResult>;
}

export class PersistentTaskQueueManager extends EventEmitter {
  private client: TaskQueueClient;
  private pollingIntervalMs: number;

  constructor(client: TaskQueueClient, pollingIntervalMs: number = 2000) {
    super();
    this.client = client;
    this.pollingIntervalMs = pollingIntervalMs;
  }

  /**
   * Submits a job payload to the external task queue and returns a TaskID.
   * @param payload The data to be processed by the external job system.
   * @returns A promise resolving to the TaskID.
   */
  public async submitJob(payload: any): Promise<TaskID> {
    console.log("Submitting job to external queue...");
    const taskId = await this.client.submitTask(payload);
    this.emit("jobSubmitted", taskId);
    return taskId;
  }

  /**
   * Non-blockingly waits for the result of a submitted task up to a specified timeout.
   * @param taskId The ID of the task to wait for.
   * @param timeoutMs The maximum time to wait in milliseconds.
   * @returns A promise resolving to the final TaskResult.
   */
  public async waitForResult(taskId: TaskID, timeoutMs: number): Promise<TaskResult> {
    const startTime = Date.now();

    const poll = async (): Promise<TaskResult> => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeoutMs) {
        throw new Error(`Timeout reached while waiting for task ${taskId}.`);
      }

      try {
        const result = await this.client.pollTask(taskId);
        return result;
      } catch (e) {
        throw new Error(`Failed to poll task ${taskId}: ${(e as Error).message}`);
      }
    };

    let lastResult: TaskResult | null = null;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await poll();
        lastResult = result;

        if (result.status === "COMPLETE") {
          return result;
        }
        if (result.status === "FAILED") {
          return result;
        }

        await new Promise(resolve => setTimeout(resolve, this.pollingIntervalMs));

      } catch (e) {
        // If polling fails, wait and retry until timeout or success
        await new Promise(resolve => setTimeout(resolve, this.pollingIntervalMs));
      }
    }

    // If loop finishes due to timeout
    if (lastResult) {
      return lastResult;
    }
    throw new Error(`Timeout reached for task ${taskId} without receiving a final status.`);
  }
}