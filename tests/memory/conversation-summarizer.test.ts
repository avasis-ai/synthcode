import { describe, it, expect, vi } from "vitest";
import { ConversationSummarizer } from "../src/memory/conversation-summarizer";
import { Message } from "../src/memory/types";

describe("ConversationSummarizer", () => {
  it("should call the llmAdapter summarize method with correct arguments", async () => {
    const mockLlmAdapter = {
      summarize: vi.fn(),
    } as unknown as LLMAdapter;
    const summarizer = new ConversationSummarizer(mockLlmAdapter);

    const history: Message[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];
    const options = { style: "concise" };
    const systemPrompt = "You are a helpful assistant.";

    mockLlmAdapter.summarize.mockResolvedValue("Summary");

    await summarizer.summarize(history, options, systemPrompt);

    expect(mockLlmAdapter.summarize).toHaveBeenCalledWith(
      history,
      options,
      systemPrompt
    );
  });

  it("should handle null or undefined options gracefully", async () => {
    const mockLlmAdapter = {
      summarize: vi.fn(),
    } as unknown as LLMAdapter;
    const summarizer = new ConversationSummarizer(mockLlmAdapter);

    const history: Message[] = [{ role: "user", content: "Test" }];
    const systemPrompt = "System prompt";

    mockLlmAdapter.summarize.mockResolvedValue("Summary");

    await summarizer.summarize(history, undefined, systemPrompt);

    expect(mockLlmAdapter.summarize).toHaveBeenCalledWith(
      history,
      undefined,
      systemPrompt
    );
  });

  it("should return the summary from the llmAdapter", async () => {
    const mockLlmAdapter = {
      summarize: vi.fn(),
    } as unknown as LLMAdapter;
    const summarizer = new ConversationSummarizer(mockLlmAdapter);

    const history: Message[] = [{ role: "user", content: "Test" }];
    const options = { style: "detailed" };
    const systemPrompt = "System prompt";
    const expectedSummary = "Detailed summary result";

    mockLlmAdapter.summarize.mockResolvedValue(expectedSummary);

    const result = await summarizer.summarize(history, options, systemPrompt);

    expect(result).toBe(expectedSummary);
  });
});