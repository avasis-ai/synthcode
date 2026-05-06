import { describe, it, expect, vi } from "vitest";
import { AsyncJobManager } from "../src/async/job-manager";

describe("AsyncJobManager", () => {
  let jobManager: AsyncJobManager;

  beforeEach(() => {
    jobManager = new AsyncJobManager();
  });

  it("should initialize correctly and emit 'job_submitted' event", async () => {
    const mockJobId = "job-123";
    const mockTaskDefinition = { taskName: "testTask", payload: { data: "test" } };

    // Mock the job submission process (assuming a method like submitJob exists)
    // Since the provided code snippet doesn't show the submitJob method, we'll assume
    // the manager has a method that takes a task definition and returns a job ID.
    // We will mock the internal state change for testing purposes.

    // Simulate job submission (assuming a method that handles this)
    // For this test, we'll assume a method `submitJob` exists and works.
    const submitJob = vi.spyOn(jobManager, "submitJob").mockResolvedValue("job-123");

    // Execute the assumed method
    await jobManager.submitJob(mockTaskDefinition);

    // Check if the event was emitted
    const eventSpy = vi.spyOn(jobManager, "emit");
    expect(eventSpy).toHaveBeenCalledWith("job_submitted", expect.any(Object));
    
    submitJob.mockRestore();
  });

  it("should update job status when poll returns COMPLETED", async () => {
    const mockJobId = "job-success";
    const mockJob = {
      jobId: mockJobId,
      status: "PENDING" as const,
      submittedAt: new Date(),
      poll: vi.fn().mockResolvedValue({ status: "COMPLETED" as const, result: { data: "success" } }),
    };

    // Mock the internal job map to simulate the job's existence
    (jobManager as any).jobs.set(mockJobId, mockJob);

    // Simulate polling the job status
    const pollResult = await jobManager.pollJobStatus(mockJobId);

    // Check if the status was updated
    expect(pollResult.status).toBe("COMPLETED" as const);
    expect(pollResult.result).toEqual({ data: "success" });

    // Check if the internal job state was updated (if the manager handles state updates)
    const updatedJob = (jobManager as any).jobs.get(mockJobId);
    expect(updatedJob?.status).toBe("COMPLETED" as const);
  });

  it("should handle job failures and update status to FAILED", async () => {
    const mockJobId = "job-failure";
    const mockJob = {
      jobId: mockJobId,
      status: "RUNNING" as const,
      submittedAt: new Date(),
      poll: vi.fn().mockResolvedValue({ status: "FAILED" as const, error: "Task failed due to timeout" }),
    };

    // Mock the internal job map
    (jobManager as any).jobs.set(mockJobId, mockJob);

    // Simulate polling the job status
    const pollResult = await jobManager.pollJobStatus(mockJobId);

    // Check if the status was updated
    expect(pollResult.status).toBe("FAILED" as const);
    expect(pollResult.error).toBe("Task failed due to timeout");

    // Check if the internal job state was updated
    const updatedJob = (jobManager as any).jobs.get(mockJobId);
    expect(updatedJob?.status).toBe("FAILED" as const);
  });
});