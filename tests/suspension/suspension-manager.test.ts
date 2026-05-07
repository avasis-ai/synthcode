import { describe, it, expect } from "vitest"
import { SuspensionManager } from "../src/suspension/suspension-manager"
import { Message } from "../src/suspension/types"

describe("SuspensionManager", () => {
  it("should initialize correctly with required context and state", () => {
    const mockContext: any = {
      history: [Message.create("user", "hello")],
      globalContext: { user: "test" },
      currentStepIndex: 0,
      remainingSteps: [],
    }
    const mockState: any = {
      suspensionId: "test-suspension-id",
      context: mockContext,
      suspensionReason: "Temporary suspension",
      timestamp: Date.now(),
    }
    const manager = new SuspensionManager(mockContext, mockState)

    expect(manager).toBeDefined()
    expect(manager.getSuspensionId()).toBe("test-suspension-id")
  })

  it("should update the context history when a new message is added", () => {
    const initialContext: any = {
      history: [Message.create("user", "initial message")],
      globalContext: {},
      currentStepIndex: 0,
      remainingSteps: [],
    }
    const mockState: any = {
      suspensionId: "test-suspension-id",
      context: initialContext,
      suspensionReason: "Test",
      timestamp: Date.now(),
    }
    const manager = new SuspensionManager(initialContext, mockState)

    const newMessage = Message.create("assistant", "new response")
    manager.addMessage(newMessage)

    expect(manager.getContext().history).toContainEqual(newMessage)
    expect(manager.getContext().history.length).toBe(2)
  })

  it("should update the remaining steps array when new steps are provided", () => {
    const initialContext: any = {
      history: [],
      globalContext: {},
      currentStepIndex: 0,
      remainingSteps: [{ type: "step", data: {} }],
    }
    const mockState: any = {
      suspensionId: "test-suspension-id",
      context: initialContext,
      suspensionReason: "Test",
      timestamp: Date.now(),
    }
    const manager = new SuspensionManager(initialContext, mockState)

    const newSteps = [
      { type: "step", data: { key: "value" } },
      { type: "step", data: {} },
    ]
    manager.addRemainingSteps(newSteps)

    expect(manager.getContext().remainingSteps).toEqual(expect.arrayContaining(newSteps))
    expect(manager.getContext().remainingSteps.length).toBe(2)
  })
})