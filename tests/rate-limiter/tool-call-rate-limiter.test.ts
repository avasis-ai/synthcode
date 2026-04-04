import { describe, it, expect, vi } from "vitest";
import { ToolCallRateLimiterImpl } from "../src/rate-limiter/tool-call-rate-limiter";

describe("ToolCallRateLimiterImpl", () => {
  let limiter: ToolCallRateLimiterImpl;

  beforeEach(() => {
    limiter = new ToolCallRateLimiterImpl();
  });

  it("should allow acquiring a token when no limits are set", async () => {
    // Assuming default behavior allows acquisition if not configured
    await expect(limiter.acquire("anyTool")).resolves.toBeUndefined();
  });

  it("should limit tool calls based on configured tool-specific rate limit", async () => {
    const toolName = "testTool";
    const limit = 2;
    const windowMs = 100;
    limiter.configure(toolName, { limit, windowMs });

    // First call should succeed
    await expect(limiter.acquire(toolName)).resolves.toBeUndefined();
    // Second call should succeed
    await expect(limiter.acquire(toolName)).resolves.toBeUndefined();

    // Third call should fail (or wait, depending on implementation, here we test for failure/rejection)
    // Assuming the implementation rejects or throws when rate limited
    await expect(limiter.acquire(toolName)).rejects.toThrow();
  });

  it("should limit global tool calls based on global rate limit", async () => {
    const limit = 1;
    const windowMs = 100;
    limiter.configureGlobal({ limit, windowMs });

    // First call should succeed
    await expect(limiter.acquire("global")).resolves.toBeUndefined();

    // Second call should fail
    await expect(limiter.acquire("global")).rejects.toThrow();
  });
});