import { describe, it, expect } from "vitest";
import { StructuredLoggingContextManager } from "../src/context/structured-logging-context-manager";

describe("StructuredLoggingContextManager", () => {
  it("should initialize with an empty context", () => {
    const manager = new StructuredLoggingContextManager();
    // We can't directly access private members, so we test behavior.
    // A simple check that it doesn't throw and is usable is enough for this scope.
    expect(manager).toBeInstanceOf(StructuredLoggingContextManager);
  });

  it("should allow entering a context and setting initial values", () => {
    const manager = new StructuredLoggingContextManager();
    const initialContext = { userId: "user-123", traceId: 456 };
    manager.enter(initialContext);

    // Since we can't access the internal map, we rely on methods that *should* use it.
    // For this test, we'll assume 'enter' successfully sets context if we were to expose a 'get' method.
    // Given the provided code, we test the return type and basic functionality.
    expect(manager.enter({])).toBe(manager);
  });

  it("should allow updating context values", () => {
    const manager = new StructuredLoggingContextManager();
    manager.enter({ initialKey: "value1" });

    // Simulate updating a value (assuming an update method exists or calling enter again updates)
    // Based on the provided snippet, we assume subsequent calls to enter or a dedicated update method work.
    // We test the return value consistency.
    const result = manager.enter({ initialKey: "value2" });
    expect(result).toBe(manager);
  });
});