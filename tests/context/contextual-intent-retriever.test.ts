import { describe, it, expect } from "vitest";
import { ContextualIntentRetriever } from "../src/context/contextual-intent-retriever";

describe("ContextualIntentRetriever", () => {
  it("should correctly retrieve intent when provided with a mock classifier and context", () => {
    const mockClassifier: any = {
      classify: jest.fn(() => ({
        intent: "book_flight",
        parameters: { destination: "New York" },
      })),
    };
    const mockRetriever = new ContextualIntentRetriever(mockClassifier, []);
    const result = mockRetriever.retrieveIntent("Book me a flight to New York");

    expect(mockClassifier.classify).toHaveBeenCalledWith("Book me a flight to New York");
    expect(result).toEqual({
      intent: "book_flight",
      parameters: { destination: "New York" },
    });
  });

  it("should handle cases where the intent classifier returns no specific intent", () => {
    const mockClassifier: any = {
      classify: jest.fn(() => ({
        intent: "general_query",
        parameters: {},
      })),
    };
    const mockRetriever = new ContextualIntentRetriever(mockClassifier, []);
    const result = mockRetriever.retrieveIntent("What is the weather like?");

    expect(mockClassifier.classify).toHaveBeenCalledWith("What is the weather like?");
    expect(result).toEqual({
      intent: "general_query",
      parameters: {},
    });
  });

  it("should return the intent from the classifier even if context is empty", () => {
    const mockClassifier: any = {
      classify: jest.fn(() => ({
        intent: "check_balance",
        parameters: {},
      })),
    };
    const mockRetriever = new ContextualIntentRetriever(mockClassifier, []);
    const result = mockRetriever.retrieveIntent("What's my balance?");

    expect(mockClassifier.classify).toHaveBeenCalledWith("What's my balance?");
    expect(result).toEqual({
      intent: "check_balance",
      parameters: {},
    });
  });
});