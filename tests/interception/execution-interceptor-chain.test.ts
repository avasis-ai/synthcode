import { describe, it, expect } from "vitest";
import { ExecutionInterceptorChain } from "../src/interception/execution-interceptor-chain.js";

describe("ExecutionInterceptorChain", () => {
  it("should correctly execute interceptors in order", async () => {
    const mockInterceptor1 = vi.fn((context) => ({ ...context, modified: "1" }));
    const mockInterceptor2 = vi.fn((context) => ({ ...context, modified: "2" }));
    const chain = new ExecutionInterceptorChain([mockInterceptor1, mockInterceptor2]);

    const context = {
      currentMessage: { role: "user", content: "test" },
      history: [],
      state: {},
      toolCallId: "id1",
    };

    const result = await chain.intercept(context);

    expect(mockInterceptor1).toHaveBeenCalledTimes(1);
    expect(mockInterceptor2).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ...context, modified: "2" });
  });

  it("should handle an empty interceptor list gracefully", async () => {
    const chain = new ExecutionInterceptorChain([]);
    const context = {
      currentMessage: { role: "user", content: "test" },
      history: [],
      state: {},
      toolCallId: "id1",
    };

    const result = await chain.intercept(context);

    expect(result).toEqual(context);
  });

  it("should pass the result of the previous interceptor to the next one", async () => {
    const mockInterceptor1 = vi.fn((context) => ({ ...context, value: "A" }));
    const mockInterceptor2 = vi.fn((context) => ({ ...context, value: `${context.value}B` }));
    const chain = new ExecutionInterceptorChain([mockInterceptor1, mockInterceptor2]);

    const initialContext = {
      currentMessage: { role: "user", content: "test" },
      history: [],
      state: {},
      toolCallId: "id1",
    };

    const result = await chain.intercept(initialContext);

    expect(mockInterceptor1).toHaveBeenCalledWith(initialContext);
    expect(mockInterceptor2).toHaveBeenCalledWith({ ...initialContext, value: "A" });
    expect(result).toEqual({ ...initialContext, value: "A" });
  });
});