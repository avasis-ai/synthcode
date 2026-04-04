// tests/tool.ts
import { describe, it, expect } from "vitest"
import { tool } from "../src/tool.js"

describe("Tool Execution", () => {
  it("should execute a tool", () => {
    const result = tool.execute("echo", ["Hello, World!"])
    expect(result).toBe("Hello, World!")
  })

  it("should handle errors", () => {
    try {
      tool.execute("nonexistent", [])
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain("nonexistent")
    }
  })
})