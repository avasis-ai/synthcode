import { describe, it, expect, vi } from "vitest";
import { ToolCallLoggingMiddleware } from "../src/middleware/tool-call-logging-middleware";

describe("ToolCallLoggingMiddleware", () => {
  it("should call the logger with the correct context before calling next", async () => {
    const mockLogger = vi.fn();
    const middleware = new ToolCallLoggingMiddleware(mockLogger);
    const mockNext = vi.fn(async (enrichedContext) => {
      return { result: "success" };
    });

    const mockContext: any = {
      message: { content: "Test message" },
      toolCall: { name: "testTool", arguments: { id: "123" } },
      context: { userId: "user1" },
    };

    await middleware.createMiddleware(mockContext).invoke(mockContext);

    expect(mockLogger).toHaveBeenCalledTimes(1);
    expect(mockLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        message: mockContext.message,
        toolCall: mockContext.toolCall,
        context: mockContext.context,
      })
    );
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: mockContext.message,
        toolCall: mockContext.toolCall,
        context: mockContext.context,
      })
    );
  });

  it("should pass through the result from the next middleware", async () => {
    const mockLogger = vi.fn();
    const middleware = new ToolCallLoggingMiddleware(mockLogger);
    const mockNext = vi.fn(async (enrichedContext) => {
      return { result: "next_result" };
    });

    const mockContext: any = {
      message: { content: "Test message" },
      toolCall: { name: "testTool", arguments: { id: "123" } },
      context: { userId: "user1" },
    };

    const result = await middleware.createMiddleware(mockContext).invoke(mockContext);

    expect(result).toEqual({ result: "next_result" });
  });

  it("should handle cases where the next middleware throws an error", async () => {
    const mockLogger = vi.fn();
    const middleware = new ToolCallLoggingMiddleware(mockLogger);
    const mockNext = vi.fn(async (enrichedContext) => {
      throw new Error("Middleware failed");
    });

    const mockContext: any = {
      message: { content: "Test message" },
      toolCall: { name: "testTool", arguments: { id: "123" } },
      context: { userId: "user1" },
    };

    await expect(middleware.createMiddleware(mockContext).invoke(mockContext)).rejects.toThrow("Middleware failed");
    expect(mockLogger).toHaveBeenCalledTimes(1);
  });
});