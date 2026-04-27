import { describe, it, expect } from "vitest";
import { InvocationLogger } from "../src/tool/invocation-logger";

describe("InvocationLogger", () => {
  it("should be a singleton instance", () => {
    const logger1 = InvocationLogger.getInstance();
    const logger2 = InvocationLogger.getInstance();
    expect(logger1).toBe(logger2);
  });

  it("should log an invocation entry correctly", () => {
    const logger = InvocationLogger.getInstance();
    const context = { user: "testUser" };
    const toolName = "testTool";
    const startTime = Date.now();
    const endTime = startTime + 100;
    const success = true;
    const output = { result: "success" };

    // @ts-ignore - Accessing private/internal method for testing purposes
    logger.logInvocation(toolName, context, startTime, endTime, success, output);

    // Wait a moment to ensure internal state update (though synchronous in this mock)
    // We rely on the internal structure for this test.
    const logs = (logger as any).getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].toolName).toBe(toolName);
    expect(logs[0].success).toBe(success);
  });

  it("should emit an event upon logging an invocation", () => {
    const logger = InvocationLogger.getInstance();
    const mockEmitter = vitest.fn();

    logger.on("invocationLogged", mockEmitter);

    const toolName = "eventTool";
    const context = {};
    const startTime = Date.now();
    const endTime = startTime + 50;
    const success = false;
    const output = null;

    // @ts-ignore - Accessing private/internal method for testing purposes
    logger.logInvocation(toolName, context, startTime, endTime, success, output);

    expect(mockEmitter).toHaveBeenCalledTimes(1);
    const emittedArgs = mockEmitter.mock.calls[0][0];
    expect(emittedArgs.toolName).toBe(toolName);
    expect(emittedArgs.success).toBe(success);
  });
});