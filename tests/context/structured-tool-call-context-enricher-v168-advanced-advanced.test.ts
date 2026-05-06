import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricher } from "../src/context/structured-tool-call-context-enricher-v168-advanced-advanced";
import { Message, ToolUseBlock, ContentBlock, ThinkingBlock } from "../src/context/types";

describe("StructuredToolCallContextEnricher", () => {
    it("should enrich context with basic history and state when no specific context sources are provided", () => {
        const enricher = new StructuredToolCallContextEnricher();
        const context: { history: Message[]; knowledge: Record<string, any>; state: Record<string, any>; metadata: Record<string, any> } = {
            history: [
                { role: "user", content: [{ type: "text", text: "Hello" }] } as Message,
                { role: "assistant", content: [{ type: "text", text: "Hi there!" }] } as Message,
            ],
            knowledge: { user_prefs: "dark_mode" },
            state: { session_id: "abc-123" },
            metadata: { source: "web_app" },
        };

        const enrichedContext = enricher.enrich(context);

        expect(enrichedContext.history).toEqual(context.history);
        expect(enrichedContext.knowledge).toEqual(context.knowledge);
        expect(enrichedContext.state).toEqual(context.state);
        expect(enrichedContext.metadata).toEqual(context.metadata);
    });

    it("should correctly merge context from multiple defined sources", () => {
        const mockContextSources: { sourceName: string; get?: (context: { history: Message[]; knowledge: Record<string, any>; state: Record<string, any>; metadata: Record<string, any> }) => any }[] = [
            { sourceName: "history_source", get: (context) => context.history.length > 0 ? { last_user_message: context.history[0].content[0].text } : null },
            { sourceName: "knowledge_source", get: (context) => context.knowledge.user_prefs || "default" },
            { sourceName: "state_source", get: (context) => context.state.session_id || "unknown" },
        ];

        const enricher = new StructuredToolCallContextEnricher(mockContextSources);
        const context: { history: Message[]; knowledge: Record<string, any>; state: Record<string, any>; metadata: Record<string, any> } = {
            history: [{ role: "user", content: [{ type: "text", text: "Test" }] }] as Message[],
            knowledge: { user_prefs: "dark_mode" },
            state: { session_id: "test-session" },
            metadata: {} as Record<string, any>,
        };

        const enrichedContext = enricher.enrich(context);

        expect(enrichedContext.sources).toHaveLength(3);
        expect(enrichedContext.sources.find(s => s.sourceName === "history_source")?.value).toBe("Test");
        expect(enrichedContext.sources.find(s => s.sourceName === "knowledge_source")?.value).toBe("dark_mode");
        expect(enrichedContext.sources.find(s => s.sourceName === "state_source")?.value).toBe("test-session");
    });

    it("should handle cases where context sources return null or undefined", () => {
        const mockContextSources: { sourceName: string; get?: (context: { history: Message[]; knowledge: Record<string, any>; state: Record<string, any>; metadata: Record<string, any> }) => any }[] = [
            { sourceName: "source_a", get: () => null },
            { sourceName: "source_b", get: () => undefined },
            { sourceName: "source_c", get: (context) => context.metadata.source || "fallback" },
        ];

        const enricher = new StructuredToolCallContextEnricher(mockContextSources);
        const context: { history: Message[]; knowledge: Record<string, any>; state: Record<string, any>; metadata: Record<string, any> } = {
            history: [] as Message[],
            knowledge: {} as Record<string, any>,
            state: {} as Record<string, any>,
            metadata: { source: "web_app" },
        };

        const enrichedContext = enricher.enrich(context);

        expect(enrichedContext.sources).toHaveLength(3);
        expect(enrichedContext.sources.find(s => s.sourceName === "source_a")?.value).toBeNull();
        expect(enrichedContext.sources.find(s => s.sourceName === "source_b")?.value).toBeUndefined();
        expect(enrichedContext.sources.find(s => s.sourceName === "source_c")?.value).toBe("web_app");
    });
});