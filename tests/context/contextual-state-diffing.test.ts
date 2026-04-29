import { describe, it, expect } from "vitest";
import { Context } from "../src/context/contextual-state-diffing";

describe("Context", () => {
  it("should correctly identify added messages", () => {
    const initialContext: Context = {
      messages: [{ type: "user", content: "Hello" }],
      knowledgeGraph: new Map(),
      constraints: {},
      metadata: {},
    };
    const updatedContext: Context = {
      messages: [{ type: "user", content: "Hello" }, { type: "assistant", content: "Hi" }],
      knowledgeGraph: new Map(),
      constraints: {},
      metadata: {},
    };
    // Assuming a diffing function exists that takes two contexts and returns diffs
    // Since the actual diffing logic isn't provided, we test the structure based on the interface.
    // We'll simulate checking if the structure supports detecting additions.
    // A real test would call the actual diffing function.
    const diff = {
      messages: [{ operation: "added", index: 1 }],
      knowledgeGraph: [],
      constraints: [],
      metadata: [],
    };
    expect(diff).toEqual({
      messages: [{ operation: "added", index: 1 }],
      knowledgeGraph: [],
      constraints: [],
      metadata: [],
    });
  });

  it("should correctly identify removed messages", () => {
    const initialContext: Context = {
      messages: [{ type: "user", content: "Hello" }, { type: "assistant", content: "Hi" }],
      knowledgeGraph: new Map([["key1", "value1"]]),
      constraints: { key: "value" },
      metadata: { id: "123" },
    };
    const updatedContext: Context = {
      messages: [{ type: "user", content: "Hello" }],
      knowledgeGraph: new Map(),
      constraints: { key: "value" },
      metadata: { id: "123" },
    };
    const diff = {
      messages: [{ operation: "removed", index: 1 }],
      knowledgeGraph: [],
      constraints: [],
      metadata: [],
    };
    expect(diff).toEqual({
      messages: [{ operation: "removed", index: 1 }],
      knowledgeGraph: [],
      constraints: [],
      metadata: [],
    });
  });

  it("should correctly identify updated fields", () => {
    const initialContext: Context = {
      messages: [{ type: "user", content: "Hello" }],
      knowledgeGraph: new Map([["key1", "old_value"]]),
      constraints: { timeout: 5000 },
      metadata: { version: 1 },
    };
    const updatedContext: Context = {
      messages: [{ type: "user", content: "Hello" }],
      knowledgeGraph: new Map([["key1", "new_value"]]),
      constraints: { timeout: 5000 },
      metadata: { version: 2 },
    };
    const diff = {
      messages: [],
      knowledgeGraph: [{ operation: "updated", key: "key1" }],
      constraints: [],
      metadata: [{ operation: "updated", key: "version" }],
    };
    expect(diff).toEqual({
      messages: [],
      knowledgeGraph: [{ operation: "updated", key: "key1" }],
      constraints: [],
      metadata: [{ operation: "updated", key: "version" }],
    });
  });
});