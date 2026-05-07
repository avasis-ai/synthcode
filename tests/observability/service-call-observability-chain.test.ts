import { describe, it, expect } from "vitest";
import { ServiceCallObservabilityChain, ObservabilityHook } from "../src/observability/service-call-observability-chain";

describe("ServiceCallObservabilityChain", () => {
  it("should initialize correctly and allow adding hooks", async () => {
    const chain = new ServiceCallObservabilityChain();
    const hook1: ObservabilityHook = { name: "hook1" };
    const hook2: ObservabilityHook = { name: "hook2" };

    const result = chain.addHook(hook1).addHook(hook2);

    expect(result).toBe(chain);
    // Note: Since we cannot access private members directly in a simple test,
    // we rely on the return value and the functional contract.
  });

  it("should execute preCall hook before the main logic (if implemented)", async () => {
    const chain = new ServiceCallObservabilityChain();
    const preCallSpy = vi.fn();

    const hook: ObservabilityHook = {
      name: "preCallHook",
      preCall: async (context: any) => {
        preCallSpy(context);
      },
    };

    chain.addHook(hook);

    // Simulate the execution flow that would trigger preCall
    await (chain as any).executePreCall(new Context());

    expect(preCallSpy).toHaveBeenCalledTimes(1);
  });

  it("should execute postCall hook after successful execution", async () => {
    const chain = new ServiceCallObservabilityChain();
    const postCallSpy = vi.fn();
    const mockResult = { data: "success" };

    const hook: ObservabilityHook = {
      name: "postCallHook",
      postCall: async (context: any, result: any) => {
        postCallSpy(context, result);
      },
    };

    chain.addHook(hook);

    // Simulate the execution flow that would trigger postCall
    await (chain as any).executePostCall(new Context(), mockResult);

    expect(postCallSpy).toHaveBeenCalledTimes(1);
    expect(postCallSpy).toHaveBeenCalledWith(expect.any(Context), mockResult);
  });
});