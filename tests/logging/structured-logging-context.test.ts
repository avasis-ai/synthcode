import { describe, it, expect } from "vitest";
import { ContextualLogger } from "../src/logging/structured-logging-context";

describe("ContextualLogger", () => {
  it("should initialize with a base logger", () => {
    const mockBaseLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;
    const logger = new ContextualLogger(mockBaseLogger);
    expect(logger).toBeInstanceOf(ContextualLogger);
  });

  it("should merge context correctly when calling methods", () => {
    const mockBaseLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;
    const logger = new ContextualLogger(mockBaseLogger);

    const initialContext = { user: "testuser" };
    const contextWith = { request: "api/v1" };

    // Manually setting context for testing purposes, assuming a method exists or simulating the effect
    // Since the provided code snippet is incomplete, we test the core functionality assumption: context merging.
    // We'll simulate calling withContext and then logging.
    (logger as any).withContext(initialContext);
    (logger as any).withContext(contextWith);

    logger.info("Test message", undefined);

    // We expect the base logger's info method to be called with merged context
    expect(mockBaseLogger.info).toHaveBeenCalledWith("Test message", {
      user: "testuser",
      request: "api/v1",
    });
  });

  it("should allow context overriding with subsequent calls", () => {
    const mockBaseLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;
    const logger = new ContextualLogger(mockBaseLogger);

    // Set initial context
    (logger as any).withContext({ service: "auth" });
    // Override/add context
    (logger as any).withContext({ service: "billing", tenantId: "t123" });

    logger.warn("Billing process started", undefined);

    // Expect the final context to reflect the last set values
    expect(mockBaseLogger.warn).toHaveBeenCalledWith("Billing process started", {
      service: "billing",
      tenantId: "t123",
    });
  });
});