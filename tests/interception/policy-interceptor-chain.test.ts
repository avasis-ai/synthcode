import { describe, it, expect, vi } from "vitest";
import { PolicyInterceptorChain, PolicyInterceptor } from "../src/interception/policy-interceptor-chain";

describe("PolicyInterceptorChain", () => {
  it("should execute all registered interceptors sequentially and return the final context", async () => {
    const mockContext = { userId: 1, data: "initial" };
    const mockAction = "read";
    const interceptor1: PolicyInterceptor = {
      async intercept(context: any, action: any): Promise<any> {
        context.data = "modified by 1";
        return context;
      },
    };
    const interceptor2: PolicyInterceptor = {
      async intercept(context: any, action: any): Promise<any> {
        context.data = "modified by 2";
        return context;
      },
    };

    const chain = new PolicyInterceptorChain([interceptor1, interceptor2]);
    const finalContext = await chain.intercept(mockContext, mockAction);

    expect(finalContext).toBeDefined();
    expect(finalContext.data).toBe("modified by 2");
  });

  it("should return the original context if no interceptors are provided", async () => {
    const mockContext = { userId: 2, data: "initial" };
    const mockAction = "write";
    const chain = new PolicyInterceptorChain([]);
    const finalContext = await chain.intercept(mockContext, mockAction);

    expect(finalContext).toBe(mockContext);
    expect(finalContext.data).toBe("initial");
  });

  it("should handle asynchronous interceptors correctly", async () => {
    const mockContext = { userId: 3, data: "initial" };
    const mockAction = "delete";
    const interceptor1: PolicyInterceptor = {
      async intercept(context: any, action: any): Promise<any> {
        await new Promise((resolve) => setTimeout(resolve, 10));
        context.data = "modified by async 1";
        return context;
      },
    };
    const interceptor2: PolicyInterceptor = {
      async intercept(context: any, action: any): Promise<any> {
        context.data = "modified by async 2";
        return context;
      },
    };

    const chain = new PolicyInterceptorChain([interceptor1, interceptor2]);
    const finalContext = await chain.intercept(mockContext, mockAction);

    expect(finalContext).toBeDefined();
    expect(finalContext.data).toBe("modified by async 2");
  });
});