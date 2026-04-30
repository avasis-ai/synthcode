import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricherV167AdvancedAdvanced } from "../src/validation/structured-tool-call-validator-context-enricher-v167-advanced-advanced";
import { ToolCall, AgentContext, KnowledgeGraphContext } from "../src/validation/types";

describe("StructuredToolCallValidatorContextEnricherV167AdvancedAdvanced", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV167AdvancedAdvanced();

    it("should enrich the tool call and context when all inputs are valid", () => {
        const rawToolCall: ToolCall = {
            name: "get_user_profile",
            arguments: { user_id: "123" },
        };
        const agentContext: AgentContext = {
            messages: [
                { role: "user", content: "What is my profile?" }
            ],
            // Mock other context properties if necessary
        };
        const knowledgeGraphContext: KnowledgeGraphContext = {
            // Mock knowledge graph data
        };

        const result = enricher.enrich(rawToolCall, agentContext, knowledgeGraphContext);

        expect(result.enrichedToolCall).toEqual(rawToolCall); // Assuming no change for this simple test
        expect(result.enrichedContext).toBeDefined();
    });

    it("should handle an empty agent context gracefully", () => {
        const rawToolCall: ToolCall = {
            name: "search_database",
            arguments: { query: "test" },
        };
        const agentContext: AgentContext = {
            messages: [],
        };
        const knowledgeGraphContext: KnowledgeGraphContext = {
            // Mock knowledge graph data
        };

        const result = enricher.enrich(rawToolCall, agentContext, knowledgeGraphContext);

        expect(result.enrichedToolCall).toEqual(rawToolCall);
        expect(result.enrichedContext).toBeDefined();
    });

    it("should correctly enrich context when knowledge graph provides relevant data", () => {
        const rawToolCall: ToolCall = {
            name: "get_user_details",
            arguments: { user_id: "456" },
        };
        const agentContext: AgentContext = {
            messages: [{ role: "user", content: "Details for user 456" }],
        };
        const knowledgeGraphContext: KnowledgeGraphContext = {
            user_details: {
                user_id: "456",
                department: "Engineering"
            }
        };

        const result = enricher.enrich(rawToolCall, agentContext, knowledgeGraphContext);

        // Assert that the context enrichment utilized the KG data
        expect(result.enrichedContext).toEqual(expect.objectContaining({
            knowledgeGraphData: {
                user_id: "456",
                department: "Engineering"
            }
        }));
    });
});