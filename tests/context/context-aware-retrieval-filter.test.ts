import { describe, it, expect } from "vitest";
import { ContextAwareRetrievalFilter } from "../src/context/context-aware-retrieval-filter";

describe("ContextAwareRetrievalFilter", () => {
  it("should correctly filter documents based on user query context", async () => {
    const filter = new ContextAwareRetrievalFilter();
    const documents = [
      { id: "doc1", content: "The capital of France is Paris." },
      { id: "doc2", content: "The largest planet in our solar system is Jupiter." },
      { id: "doc3", content: "Paris is a beautiful city on the Seine river." },
    ];
    const userQuery = "What is the capital of France?";
    const filteredDocs = await filter.filter(documents, userQuery);

    expect(filteredDocs).toHaveLength(2);
    expect(filteredDocs.map(doc => doc.id)).toEqual(["doc1", "doc3"]);
  });

  it("should return all documents if the query is too general", async () => {
    const filter = new ContextAwareRetrievalFilter();
    const documents = [
      { id: "doc1", content: "Apple is a fruit." },
      { id: "doc2", content: "Apple Inc. is a technology company." },
      { id: "doc3", content: "Red color is visible light." },
    ];
    const userQuery = "Tell me about things.";
    const filteredDocs = await filter.filter(documents, userQuery);

    expect(filteredDocs).toHaveLength(3);
  });

  it("should prioritize contextually relevant documents when multiple topics are present", async () => {
    const filter = new ContextAwareRetrievalFilter();
    const documents = [
      { id: "docA", content: "The meeting is scheduled for Tuesday." },
      { id: "docB", content: "Please review the Q3 financial report." },
      { id: "docC", content: "The next meeting will be on Tuesday afternoon." },
    ];
    const userQuery = "Regarding the meeting, when should I prepare?";
    const filteredDocs = await filter.filter(documents, userQuery);

    expect(filteredDocs).toHaveLength(2);
    expect(filteredDocs.map(doc => doc.id)).toEqual(["docA", "docC"]);
  });
});