import { describe, it, expect, vi } from "vitest";
import { StructuredThoughtChainWithExternalToolCallV4 } from "../src/thought/structured-thought-chaining-with-external-tool-call-v4";

describe("StructuredThoughtChainWithExternalToolCallV4", () => {
    it("should correctly process a simple thought chain without tool calls", async () => {
        const mockToolExecutor: any = {
            execute: vi.fn(() => Promise.resolve("some result")),
        };
        const chain = new StructuredThoughtChainWithExternalToolCallV4(mockToolExecutor);

        const initialMessages: any[] = [
            new UserMessage("What is the capital of France?"),
        ];

        const result = await chain.process(initialMessages);

        expect(result).toBeDefined();
        // Check if the result contains the expected thought process
        const thoughtBlock = result.contentBlocks.find(block => block.type === "thinking");
        expect(thoughtBlock?.text).toContain("The capital of France is Paris.");
        expect(mockToolExecutor.execute).not.toHaveBeenCalled();
    });

    it("should call the external tool executor when a tool use is required", async () => {
        const mockToolExecutor: any = {
            execute: vi.fn().mockResolvedValue("The current weather is 25C."),
        };
        const chain = new StructuredThoughtChainWithExternalToolCallV4(mockToolExecutor);

        const initialMessages: any[] = [
            new UserMessage("What is the weather like in London right now?"),
        ];

        const result = await chain.process(initialMessages);

        expect(result).toBeDefined();
        // Check if the tool executor was called with the correct arguments
        expect(mockToolExecutor.execute).toHaveBeenCalledWith("get_current_weather", { location: "London" });
        // Check if the final output incorporates the tool result
        const finalThoughtBlock = result.contentBlocks.find(block => block.type === "thinking");
        expect(finalThoughtBlock?.text).toContain("The weather in London is 25C.");
    });

    it("should handle multiple steps involving thought and tool calls sequentially", async () => {
        const mockToolExecutor: any = {
            execute: vi.fn()
                .mockResolvedValueOnce("Step 1 result: Initial data.")
                .mockResolvedValueOnce("Step 2 result: Final summary data."),
        };
        const chain = new StructuredThoughtChainWithExternalToolCallV4(mockToolExecutor);

        const initialMessages: any[] = [
            new UserMessage("Analyze the data for London and summarize the findings."),
        ];

        const result = await chain.process(initialMessages);

        expect(result).toBeDefined();
        // Expect tool to be called twice
        expect(mockToolExecutor.execute).toHaveBeenCalledTimes(2);
        // Check if the final thought reflects both tool calls
        const finalThoughtBlock = result.contentBlocks.find(block => block.type === "thinking");
        expect(finalThoughtBlock?.text).toContain("Initial data.");
        expect(finalThoughtBlock?.text).toContain("Final summary data.");
    });
});