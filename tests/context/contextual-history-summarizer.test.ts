import { describe, it, expect } from "vitest";
import { HistorySummarizer } from "../src/context/contextual-history-summarizer";

describe("HistorySummarizer", () => {
    it("should correctly chunk the history when the history size is a multiple of chunk size", () => {
        const history: Message[] = Array(20).fill({ type: "user", content: "message" } as Message);
        const summarizer = new HistorySummarizer(history, 10);
        const chunks = summarizer["getChunkedHistory"]();
        expect(chunks.length).toBe(2);
        expect(chunks[0].length).toBe(10);
        expect(chunks[1].length).toBe(10);
    });

    it("should correctly chunk the history when the history size is not a multiple of chunk size", () => {
        const history: Message[] = Array(23).fill({ type: "user", content: "message" } as Message);
        const summarizer = new HistorySummarizer(history, 7);
        const chunks = summarizer["getChunkedHistory"]();
        expect(chunks.length).toBe(4);
        expect(chunks[0].length).toBe(7);
        expect(chunks[1].length).toBe(7);
        expect(chunks[2].length).toBe(7);
        expect(chunks[3].length).toBe(2);
    });

    it("should return an empty array of chunks for an empty history", () => {
        const history: Message[] = [];
        const summarizer = new HistorySummarizer(history, 10);
        const chunks = summarizer["getChunkedHistory"]();
        expect(chunks).toEqual([]);
    });
});