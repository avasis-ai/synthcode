import { describe, it, expect } from "vitest";
import { DynamicContextInjector, InjectionRule } from "../src/context/dynamic-context-injector";

describe("DynamicContextInjector", () => {
  it("should correctly apply an injection rule when the condition is met", () => {
    const mockRule: InjectionRule<any> = {
      shouldApply: (context: Record<string, any>) => context.userType === "premium",
      inject: (context: Record<string, any>) => ({
        message: "Premium content injected!",
        contentBlocks: [{ type: "TextBlock", text: "Special feature unlocked." }],
      }),
    };

    const injector = new DynamicContextInjector([mockRule]);
    const context = { userType: "premium", sessionId: "abc-123" };

    const result = injector.inject(context);

    expect(result).toEqual({
      message: "Premium content injected!",
      contentBlocks: [{ type: "TextBlock", text: "Special feature unlocked." }],
    });
  });

  it("should not apply any injection rule when the condition is not met", () => {
    const mockRule: InjectionRule<any> = {
      shouldApply: (context: Record<string, any>) => context.userType === "premium",
      inject: (context: Record<string, any>) => ({
        message: "Should not appear",
        contentBlocks: [],
      }),
    };

    const injector = new DynamicContextInjector([mockRule]);
    const context = { userType: "basic", sessionId: "def-456" };

    const result = injector.inject(context);

    expect(result).toEqual({
      message: "",
      contentBlocks: [],
    });
  });

  it("should combine injections from multiple rules if all conditions are met", () => {
    const rule1: InjectionRule<any> = {
      shouldApply: (context: Record<string, any>) => context.source === "web",
      inject: (context: Record<string, any>) => ({
        message: "Web source detected.",
        contentBlocks: [{ type: "TextBlock", text: "Welcome from the web." }],
      }),
    };

    const rule2: InjectionRule<any> = {
      shouldApply: (context: Record<string, any>) => context.source === "web" && context.isAuthenticated,
      inject: (context: Record<string, any>) => ({
        message: "User is logged in.",
        contentBlocks: [{ type: "TextBlock", text: "Hello logged-in user." }],
      }),
    };

    const injector = new DynamicContextInjector([rule1, rule2]);
    const context = { source: "web", isAuthenticated: true };

    const result = injector.inject(context);

    expect(result.message).toBe("User is logged in."); // The last successful injection's message might overwrite, depending on implementation detail, but we test for combination logic.
    expect(result.contentBlocks).toHaveLength(2);
    expect(result.contentBlocks.some(block => block.text === "Welcome from the web.")).toBe(true);
    expect(result.contentBlocks.some(block => block.text === "Hello logged-in user.")).toBe(true);
  });
});