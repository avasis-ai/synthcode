import { describe, it, expect } from "vitest"
import { WorkflowRunStatus } from "../src/tool-executor"

describe("WorkflowRunStatus", () => {
    it("should be able to compare with strings", () => {
        expect(WorkflowRunStatus.FAILURE).toBe("failure")
        expect(WorkflowRunStatus.COMPLETED).toBe("completed")
        expect(WorkflowRunStatus.PENDING).toBe("pending")
    })

    it("should be able to compare with other WorkflowRunStatus instances", () => {
        expect(WorkflowRunStatus.FAILURE).toBe(WorkflowRunStatus.FAILURE)
        expect(WorkflowRunStatus.COMPLETED).toBe(WorkflowRunStatus.COMPLETED)
        expect(WorkflowRunStatus.PENDING).toBe(WorkflowRunStatus.PENDING)
    })
})

describe("WorkflowRun", () => {
    it("should be able to create a new instance", () => {
        const run = new WorkflowRun({
            id: "run1",
            name: "run1",
            status: WorkflowRunStatus.COMPLETED,
        })
        expect(run.id).toBe("run1")
        expect(run.name).toBe("run1")
        expect(run.status).toBe(WorkflowRunStatus.COMPLETED)
    })
})

describe("WorkflowRunGroup", () => {
    it("should be able to create a new instance", () => {
        const group = new WorkflowRunGroup({
            runs: {
                run1: new WorkflowRun({
                    id: "run1",
                    name: "run1",
                    status: WorkflowRunStatus.COMPLETED,
                }),
                run2: new WorkflowRun({
                    id: "run2",
                    name: "run2",
                    status: WorkflowRunStatus.PENDING,
                }),
            },
        })
        expect(group.runs).toHaveProperty("run1")
        expect(group.runs).toHaveProperty("run2")
        expect(group.runs.run1.status).toBe(WorkflowRunStatus.COMPLETED)
        expect(group.runs.run2.status).toBe(WorkflowRunStatus.PENDING)
    })
})

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
    type: "user"
    text: string
}

export interface AssistantMessage {
    type: "assistant"
    text: string
}

export interface ToolResultMessage {
    type: "tool-result"
    tool: string
    result: any
}