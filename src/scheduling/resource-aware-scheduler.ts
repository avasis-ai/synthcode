import { EventEmitter } from "events";

interface ResourceProfile {
  cpuUsage: number;
  memoryUsage: number;
  bandwidthUsage: number;
}

interface Task {
  id: string;
  name: string;
  requiredResources: {
    cpu: number;
    memory: number;
    bandwidth: number;
  };
  priority: number;
  maxRetries: number;
  currentAttempt: number;
  execute: () => Promise<void>;
}

interface SchedulerConfig {
  initialProfile: ResourceProfile;
  maxCapacity: {
    cpu: number;
    memory: number;
    bandwidth: number;
  };
  backoffFactor: number;
}

export class ResourceAwareScheduler extends EventEmitter {
  private taskQueue: Task[] = [];
  private config: SchedulerConfig;
  private currentProfile: ResourceProfile;

  constructor(config: SchedulerConfig) {
    super();
    this.config = config;
    this.currentProfile = { ...config.initialProfile };
  }

  public addTask(task: Task): void {
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    this.emit("taskAdded", task);
  }

  private canExecute(task: Task): boolean {
    return (
      this.currentProfile.cpuUsage + task.requiredResources.cpu <= this.config.maxCapacity.cpu &&
      this.currentProfile.memoryUsage + task.requiredResources.memory <= this.config.maxCapacity.memory &&
      this.currentProfile.bandwidthUsage + task.requiredResources.bandwidth <= this.config.maxCapacity.bandwidth
    );
  }

  private updateProfile(task: Task, usage: {
    cpu: number;
    memory: number;
    bandwidth: number;
  }): void {
    this.currentProfile.cpuUsage = Math.max(0, this.currentProfile.cpuUsage - task.requiredResources.cpu + usage.cpu);
    this.currentProfile.memoryUsage = Math.max(0, this.currentProfile.memoryUsage - task.requiredResources.memory + usage.memory);
    this.currentProfile.bandwidthUsage = Math.max(0, this.currentProfile.bandwidthUsage - task.requiredResources.bandwidth + usage.bandwidth);
  }

  private calculateBackoffDelay(task: Task): number {
    return Math.pow(this.config.backoffFactor, task.currentAttempt);
  }

  public async scheduleNext(): Promise<void> {
    if (this.taskQueue.length === 0) {
      this.emit("schedulingComplete", "Queue is empty.");
      return;
    }

    const task = this.taskQueue[0];

    if (this.canExecute(task)) {
      this.emit("executingTask", task);
      try {
        await task.execute();

        // Simulate resource release upon successful completion
        this.updateProfile(task, { cpu: 0, memory: 0, bandwidth: 0 });

        this.taskQueue.shift(); // Remove task
        this.emit("taskCompleted", task);
        await this.scheduleNext();

      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        await this.handleFailure(task);
        await this.scheduleNext();
      }
    } else {
      await this.handleFailure(task);
      await this.scheduleNext();
    }
  }

  private async handleFailure(task: Task): Promise<void> {
    if (task.currentAttempt >= task.maxRetries) {
      this.taskQueue.shift(); // Drop task
      this.emit("taskFailedPermanently", task);
      return;
    }

    const delay = this.calculateBackoffDelay(task);
    task.currentAttempt += 1;

    this.emit("taskDeferred", {
      task: task,
      delay: delay,
      reason: "Insufficient resources",
    });

    // In a real system, this would schedule a retry event.
    // Here, we just log and let the next call handle the delay conceptually.
    await new Promise(resolve => setTimeout(resolve, delay * 100));
  }

  public getStatus(): {
    queueSize: number;
    currentProfile: ResourceProfile;
  } {
    return {
      queueSize: this.taskQueue.length,
      currentProfile: this.currentProfile,
    };
  }
}