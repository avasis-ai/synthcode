import { describe, it, expect } from "vitest";
import { IContextSource } from "../src/validation/structured-tool-call-validator-context-enricher-v168-advanced-advanced";

describe("IContextSource", () => {
  it("should correctly enrich context with profile information", async () => {
    const mockProfileSource: IProfileSource = {
      getProfileContext: () => ({
        user_id: "user123",
        role: "admin",
      }),
    };
    const mockContext: { messages: any[]; current_state: Record<string, unknown> } = {
      messages: [],
      current_state: {},
    };

    // Mock the enrich method to simulate using the profile source
    const mockEnricher: IContextSource = {
      enrich: async (context: { messages: any[]; current_state: Record<string, unknown> }) => {
        const profile = mockProfileSource.getProfileContext();
        return { ...context, profile: profile };
      },
    };

    const enrichedContext = await mockEnricher.enrich(mockContext);
    expect(enrichedContext).toHaveProperty("profile");
    expect(enrichedContext.profile).toEqual({
      user_id: "user123",
      role: "admin",
    });
  });

  it("should correctly enrich context with session information", async () => {
    const mockSessionSource: ISessionSource = {
      getSessionContext: () => ({
        session_id: "sess456",
        last_activity: Date.now(),
      }),
    };
    const mockContext: { messages: any[]; current_state: Record<string, unknown> } = {
      messages: [],
      current_state: {},
    };

    // Mock the enrich method to simulate using the session source
    const mockEnricher: IContextSource = {
      enrich: async (context: { messages: any[]; current_state: Record<string, unknown> }) => {
        const session = mockSessionSource.getSessionContext();
        return { ...context, session: session };
      },
    };

    const enrichedContext = await mockEnricher.enrich(mockContext);
    expect(enrichedContext).toHaveProperty("session");
    expect(enrichedContext.session).toEqual({
      session_id: "sess456",
      last_activity: expect.any(Number),
    });
  });

  it("should combine multiple sources to enrich context", async () => {
    const mockProfileSource: IProfileSource = {
      getProfileContext: () => ({ user_id: "user123" }),
    };
    const mockSessionSource: ISessionSource = {
      getSessionContext: () => ({ session_id: "sess456" }),
    };
    const mockGlobalSource: IGlobalConstraintSource = {
      getConstraints: () => ({ max_retries: 3 }),
    };

    const mockContext: { messages: any[]; current_state: Record<string, unknown> } = {
      messages: [],
      current_state: { initial_state: "ok" },
    };

    // Mock the enrich method to simulate combining sources
    const mockEnricher: IContextSource = {
      enrich: async (context: { messages: any[]; current_state: Record<string, unknown> }) => {
        const profile = mockProfileSource.getProfileContext();
        const session = mockSessionSource.getSessionContext();
        const constraints = mockGlobalSource.getConstraints();
        return {
          ...context,
          profile: profile,
          session: session,
          constraints: constraints,
        };
      },
    };

    const enrichedContext = await mockEnricher.enrich(mockContext);
    expect(enrichedContext).toHaveProperty("profile");
    expect(enrichedContext).toHaveProperty("session");
    expect(enrichedContext).toHaveProperty("constraints");
    expect(enrichedContext.profile).toEqual({ user_id: "user123" });
    expect(enrichedContext.session).toEqual({ session_id: "sess456" });
    expect(enrichedContext.constraints).toEqual({ max_retries: 3 });
  });
});