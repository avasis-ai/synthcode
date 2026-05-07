import { describe, it, expect } from "vitest"
import {
  ToolCompatibilityValidator,
  AgentContext,
  ToolCallRequest,
} from "../src/validation/tool-compatibility-validator"

describe("ToolCompatibilityValidator", () => {
  it("should return no issues when tool name and version match available capabilities", async () => {
    const context: AgentContext = {
      availableCapabilities: {
        "search": {
          version: "v1",
          schema: {
            query: { type: "string" },
          },
        },
      },
      requiredSchemas: {},
    }
    const request: ToolCallRequest = {
      toolName: "search",
      toolVersion: "v1",
      inputSchema: {
        query: { type: "string" },
      },
    }
    const validator = new ToolCompatibilityValidator(context)
    const issues = validator.validate(request)
    expect(issues).toEqual([])
  })

  it("should report an issue if the tool name is not available in the context", async () => {
    const context: AgentContext = {
      availableCapabilities: {
        "search": {
          version: "v1",
          schema: {
            query: { type: "string" },
          },
        },
      },
      requiredSchemas: {},
    }
    const request: ToolCallRequest = {
      toolName: "nonexistent_tool",
      toolVersion: "v1",
      inputSchema: {
        query: { type: "string" },
      },
    }
    const validator = new ToolCompatibilityValidator(context)
    const issues = validator.validate(request)
    expect(issues).toHaveLength(1)
    expect(issues[0].checkName).toBe("ToolNameMismatch")
  })

  it("should report an issue if the tool version does not match available capabilities", async () => {
    const context: AgentContext = {
      availableCapabilities: {
        "search": {
          version: "v1",
          schema: {
            query: { type: "string" },
          },
        },
      },
      requiredSchemas: {},
    }
    const request: ToolCallRequest = {
      toolName: "search",
      toolVersion: "v2",
      inputSchema: {
        query: { type: "string" },
      },
    }
    const validator = new ToolCompatibilityValidator(context)
    const issues = validator.validate(request)
    expect(issues).toHaveLength(1)
    expect(issues[0].checkName).toBe("ToolVersionMismatch")
  })
})