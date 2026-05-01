import { describe, it, expect } from "vitest";
import { KnowledgeBase, IntentClassifier } from "../src/context/contextual-knowledge-retrieval-with-query-intent";

describe("IntentClassifier", () => {
  it("should classify a query as 'summarization' when appropriate", () => {
    const classifier = new IntentClassifier();
    const query = "Summarize the key findings from the last report.";
    const intent = classifier.classify(query);
    expect(intent.intent).toBe("summarization");
  });

  it("should classify a query as 'comparison' when comparing two items", () => {
    const classifier = new IntentClassifier();
    const query = "Compare the features of Model A versus Model B.";
    const intent = classifier.classify(query);
    expect(intent.intent).toBe("comparison");
  });

  it("should classify a general question as 'question_answering'", () => {
    const classifier = new IntentClassifier();
    const query = "What is the primary function of the CPU?";
    const intent = classifier.classify(query);
    expect(intent.intent).toBe("question_answering");
  });
});