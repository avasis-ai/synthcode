import { describe, it, expect } from "vitest"
import {
  ServiceContractDriftMonitor,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../../../src/monitoring/service-contract-drift-monitor.js"

describe("ServiceContractDriftMonitor", () => {
  it("should initialize correctly with a contract", () => {
    const contract = {
      required_fields: ["user", "assistant", "tool"],
      message_structure: {
        user: {
          role: "user",
          content: "string",
        },
        assistant: {
          role: "assistant",
          content: "any[]",
        },
        tool: {
          role: "tool",
          tool_use_id: "string",
          content: "string",
        },
      },
    }
    const monitor = new ServiceContractDriftMonitor(contract)
    expect(monitor).toBeDefined()
  })

  it("should detect drift when a required field is missing", () => {
    const contract = {
      required_fields: ["user", "assistant", "tool"],
      message_structure: {
        user: {
          role: "user",
          content: "string",
        },
        assistant: {
          role: "assistant",
          content: "any[]",
        },
        tool: {
          role: "tool",
          tool_use_id: "string",
          content: "string",
        },
      },
    }
    const monitor = new ServiceContractDriftMonitor(contract)
    const driftedMessage = {
      role: "user",
      content: "some content",
    }
    const driftDetected = monitor.checkMessage(driftedMessage)
    expect(driftDetected).toBe(true)
  })

  it("should detect drift when a field type is incorrect", () => {
    const contract = {
      required_fields: ["user", "assistant", "tool"],
      message_structure: {
        user: {
          role: "user",
          content: "string",
        },
        assistant: {
          role: "assistant",
          content: "any[]",
        },
        tool: {
          role: "tool",
          tool_use_id: "string",
          content: "string",
        },
      },
    }
    const monitor = new ServiceContractDriftMonitor(contract)
    const driftedMessage = {
      role: "user",
      content: 123, // Incorrect type (should be string)
    }
    const driftDetected = monitor.checkMessage(driftedMessage)
    expect(driftDetected).toBe(true)
  })
})