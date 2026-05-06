import { describe, it, expect, vi } from "vitest"
import { AsyncJobMonitor, JobContext, JobResult } from "../src/monitoring/async-job-monitor"

describe("AsyncJobMonitor", () => {
    it("should initialize and submit a job correctly", async () => {
        const monitor = new AsyncJobMonitor()
        const jobName = "testJob"
        const input = { data: "test" }
        const maxDurationMs = 5000

        const jobPromise = monitor.submitJob(jobName, input, maxDurationMs)

        // Check if the job submission returns a promise that resolves with a JobContext
        expect(typeof jobPromise).toBe("object")
        expect(jobPromise).toHaveProperty("then")

        // Simulate job completion immediately for testing purposes
        const jobContext: JobContext = {
            jobId: "job-123",
            status: "RUNNING",
            lastError: null,
            startTime: new Date(),
            maxDurationMs: maxDurationMs,
        }

        // Assuming the monitor has a way to simulate job completion or status updates
        // Since the actual implementation of `submitJob` is truncated, we test the structure
        // and assume the monitor handles the job lifecycle internally.
        // We will mock the internal job execution mechanism if possible, but based on the signature,
        // we just test the initial call structure.
        
        // For a robust test, we assume submitJob returns a promise that resolves to the final result or context.
        // Since we cannot run the full implementation, we test the initial state setup.
        
        // We will mock the internal job execution to ensure the promise resolves.
        (monitor as any)._simulateJobCompletion = (jobId: string, result: JobResult) => {
            return Promise.resolve(result);
        }

        const result = await monitor.submitJob(jobName, input, maxDurationMs)
        expect(result).toBeInstanceOf(JobResult)
        expect(result.success).toBe(true)
        expect(result.output).toContain("Job finished successfully")
    })

    it("should handle job failures and update context", async () => {
        const monitor = new AsyncJobMonitor()
        const jobName = "failingJob"
        const input = { data: "fail" }
        const maxDurationMs = 3000

        // Mock the internal job execution to simulate failure
        (monitor as any)._simulateJobCompletion = (jobId: string, result: JobResult) => {
            return Promise.resolve({ success: false, output: "", error: "Simulated failure" });
        }

        const result = await monitor.submitJob(jobName, input, maxDurationMs)

        expect(result).toBeDefined()
        expect(result?.success).toBe(false)
        expect(result?.error).toBe("Simulated failure")
    })

    it("should handle job timeouts gracefully", async () => {
        const monitor = new AsyncJobMonitor()
        const jobName = "timeoutJob"
        const input = { data: "timeout" }
        const maxDurationMs = 100

        // Mock the internal job execution to simulate timeout
        (monitor as any)._simulateJobCompletion = (jobId: string, result: JobResult) => {
            return Promise.reject(new Error("Job timed out"));
        }

        // We expect the monitor to catch the timeout and resolve with a specific failure state
        const result = await monitor.submitJob(jobName, input, maxDurationMs)

        expect(result).toBeDefined()
        expect(result?.success).toBe(false)
        expect(result?.error).toContain("Job timed out")
    })
})