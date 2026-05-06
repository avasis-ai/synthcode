import { describe, it, expect, vi } from "vitest"
import { ExternalWorkflowCoordinator, WorkflowStep } from "../src/workflow/external-workflow-coordinator"

describe("ExternalWorkflowCoordinator", () => {
  it("should execute all steps sequentially and return the final result", async () => {
    const mockStep1: WorkflowStep = {
      name: "step1",
      execute: async (context) => ({
        success: true,
        context: { data: "step1_data", ...context },
        output: { result1: "success" },
      }),
    }
    const mockStep2: WorkflowStep = {
      name: "step2",
      execute: async (context) => ({
        success: true,
        context: { data: "step2_data", ...context },
        output: { result2: "success" },
      }),
    }

    const coordinator = new ExternalWorkflowCoordinator([mockStep1, mockStep2])
    const result = await coordinator.run({ initialContext: { start: true } })

    expect(result.success).toBe(true)
    expect(result.context.data).toBe("step2_data")
    expect(result.output.result1).toBe("success")
    expect(result.output.result2).toBe("success")
  })

  it("should stop execution and return failure if any step fails", async () => {
    const mockStep1: WorkflowStep = {
      name: "step1",
      execute: async (context) => ({
        success: true,
        context: { data: "step1_data", ...context },
        output: { result1: "success" },
      }),
    }
    const mockStep2: WorkflowStep = {
      name: "step2",
      execute: async (context) => ({
        success: false,
        context: { error: "step2_failed", ...context },
        output: { error: "failure" },
      }),
    }
    const mockStep3: WorkflowStep = {
      name: "step3",
      execute: async (context) => ({
        success: true,
        context: { data: "step3_data", ...context },
        output: { result3: "success" },
      }),
    }

    const coordinator = new ExternalWorkflowCoordinator([mockStep1, mockStep2, mockStep3])
    const result = await coordinator.run({ initialContext: { start: true } })

    expect(result.success).toBe(false)
    expect(result.context.error).toBe("step2_failed")
    // Ensure step 3 was not executed
    // We can check the context to see if step 3's data is missing
    expect(result.context.data).toBe("step1_data")
  })

  it("should handle retries for non-critical steps", async () => {
    const mockStep: WorkflowStep = {
      name: "retryable_step",
      retryable: true,
      execute: vi.fn(async (context) => {
        if (context.attempt < 3) {
          return {
            success: false,
            context: { attempt: (context.attempt || 1) + 1, ...context },
            output: { message: "Transient failure" },
          }
        }
        return {
          success: true,
          context: { attempt: 3, ...context },
          output: { message: "Success after retries" },
        }
      }),
    }

    const coordinator = new ExternalWorkflowCoordinator([mockStep])
    const result = await coordinator.run({ initialContext: { attempt: 1 } })

    expect(result.success).toBe(true)
    expect(result.context.attempt).toBe(3)
    expect(result.output.message).toBe("Success after retries")
  })
})