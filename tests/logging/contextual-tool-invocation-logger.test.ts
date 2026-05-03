import { describe, it, expect } from "vitest";
import { ToolInvocationLogger } from "../src/logging/contextual-tool-invocation-logger";

describe("ToolInvocationLogger", () => {
  it("should create a basic log record for a tool invocation", () => {
    const logger = new ToolInvocationLogger();
    const context: any = {
      toolName: "search",
      toolInput: { query: "test" },
      currentStateSnapshot: { user: "test" },
      activeConstraints: ["high_priority"],
      history: [],
      toolDefinition: {},
    };
    const logRecord = logger.createLogRecord(context);

    expect(logRecord).toBeDefined();
    expect(logRecord.toolName).toBe("search");
    expect(logRecord.toolInput).toEqual({ query: "test" });
    expect(logRecord.context.currentStateSnapshot).toEqual({ user: "test" });
  });

  it("should correctly capture history and constraints in the log record", () => {
    const logger = new ToolInvocationLogger();
    const history: any[] = [
      { type: "user", content: "Hi" },
      { type: "assistant", content: "Hello" },
    ];
    const context: any = {
      toolName: "calculator",
      toolInput: { a: 1, b: 2 },
      currentStateSnapshot: { session_id: "abc" },
      activeConstraints: ["strict"],
      history: history,
      toolDefinition: {},
    };
    const logRecord = logger.createLogRecord(context);

    expect(logRecord.context.history).toEqual(history);
    expect(logRecord.context.activeConstraints).toEqual(["strict"]);
  });

  it("should handle empty or minimal context data gracefully", () => {
    const logger = new ToolInvocationLogger();
    const context: any = {
      toolName: "dummy_tool",
      toolInput: {},
      currentStateSnapshot: {},
      activeConstraints: [],
      history: [],
      toolDefinition: {},
    };
    const logRecord = logger.createLogRecord(context);

    expect(logRecord).toBeDefined();
    expect(logRecord.toolName).toBe("dummy_tool");
    expect(logRecord.toolInput).toEqual({});
    expect(logRecord.context.activeConstraints).toEqual([]);
  });
});