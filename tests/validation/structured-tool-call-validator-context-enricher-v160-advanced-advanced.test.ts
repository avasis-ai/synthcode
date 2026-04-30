import { describe, it, expect } from "vitest";
import { ContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v160-advanced-advanced";

describe("ContextEnricher", () => {
    it("should correctly enrich context when only history is provided", () => {
        const historyContext: any = {
            messages: [
                { role: "user", content: [{ type: "text", text: "Hello" }] }],
            ],
            source: "history",
        };
        const enricher = new ContextEnricher();
        const enrichedContext = enricher.enrich(historyContext);

        expect(enrichedContext).toHaveProperty("history");
        expect(enrichedContext.history).toEqual(historyContext);
        expect(enrichedContext).not.toHaveProperty("metadata");
        expect(enrichedContext).not.toHaveProperty("current_tool");
    });

    it("should correctly enrich context when only metadata is provided", () => {
        const metadataContext: any = {
            metadata: { user_id: "123" },
            source: "metadata",
        };
        const enricher = new ContextEnricher();
        const enrichedContext = enricher.enrich(metadataContext);

        expect(enrichedContext).toHaveProperty("metadata");
        expect(enrichedContext.metadata).toEqual(metadataContext);
        expect(enrichedContext).not.toHaveProperty("history");
        expect(enrichedContext).not.toHaveProperty("current_tool");
    });

    it("should merge context correctly when all three sources are provided", () => {
        const historyContext: any = {
            messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
            source: "history",
        };
        const metadataContext: any = {
            metadata: { source: "test" },
            source: "metadata",
        };
        const currentToolContext: any = {
            tool_name: "search",
            tool_schema: { description: "search tool" },
            current_input: { query: "vitest" },
            source: "current_tool",
        };

        const enricher = new ContextEnricher();
        const enrichedContext = enricher.enrich([
            historyContext,
            metadataContext,
            currentToolContext,
        ]);

        expect(enrichedContext).toHaveProperty("history");
        expect(enrichedContext.history).toEqual(historyContext);
        expect(enrichedContext).toHaveProperty("metadata");
        expect(enrichedContext.metadata).toEqual(metadataContext);
        expect(enrichedContext).toHaveProperty("current_tool");
        expect(enrichedContext.current_tool).toEqual(currentToolContext);
    });
});