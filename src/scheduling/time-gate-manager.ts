import { EventEmitter } from "node:events";

type TaskFunction = () => Promise<void>;

interface ScheduledJob {
  executionTime: number;
  task: TaskFunction;
  isRecurring: boolean;
  intervalMs: number | null;
}

export class TimeGateManager extends EventEmitter {
  private queue: ScheduledJob[] = [];
  private isRunning: boolean = false;

  constructor() {
    super();
    super.removeAllListeners();
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => a.executionTime - b.executionTime);
  }

  public scheduleTask(task: TaskFunction, delayMs: number): void {
    const executionTime = Date.now() + delayMs;
    const job: ScheduledJob = {
      executionTime: executionTime,
      task: task,
      isRecurring: false,
      intervalMs: null,
    };
    this.queue.push(job);
    this.sortQueue();
  }

  public scheduleRecurringTask(task: TaskFunction, intervalMs: number): void {
    const executionTime = Date.now() + intervalMs;
    const job: ScheduledJob = {
      executionTime: executionTime,
      task: task,
      isRecurring: true,
      intervalMs: intervalMs,
    };
    this.queue.push(job);
    this.sortQueue();
  }

  private processJob(job: ScheduledJob): Promise<void> {
    return job.task().then(() => {
      if (job.isRecurring && job.intervalMs !== null) {
        const nextExecutionTime = Date.now() + job.intervalMs;
        const nextJob: ScheduledJob = {
          executionTime: nextExecutionTime,
          task: job.task,
          isRecurring: true,
          intervalMs: job.intervalMs,
        };
        this.queue.push(nextJob);
        this.sortQueue();
      }
    });
  }

  public async tick(): Promise<void> {
    if (this.isRunning) {
      return Promise.resolve();
    }

    this.isRunning = true;

    while (this.queue.length > 0) {
      const nextJob = this.queue[0];
      const currentTime = Date.now();

      if (nextJob.executionTime > currentTime) {
        break;
      }

      const jobToExecute = this.queue.shift()!;
      
      try {
        await this.processJob(jobToExecute);
      } catch (error) {
        console.error("Error executing scheduled task:", error);
      }
    }

    if (this.queue.length > 0) {
      const nextExecutionTime = this.queue[0].executionTime;
      const delay = Math.max(0, nextExecutionTime - Date.now());
      
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }

    this.isRunning = false;
  }

  public start(): Promise<void> {
    if (this.isRunning) {
      return Promise.resolve();
    }
    
    const runCycle = async (): Promise<void> => {
      await this.tick();
      if (this.queue.length > 0) {
        await runCycle();
      }
    };

    return runCycle();
  }
}