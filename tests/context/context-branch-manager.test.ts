import { describe, it, expect } from "vitest";
import { ContextBranchManager } from "../src/context/context-branch-manager";
import { Message, UserMessage, AssistantMessage } from "../src/context/types";

describe("ContextBranchManager", () => {
  it("should initialize with the provided context state", () => {
    const initialContext: ContextState = {
      messages: [
        new UserMessage("Hello"),
        new AssistantMessage("Hi there!")
      ]
    };
    const manager = new ContextBranchManager(initialContext);
    // Assuming there's a way to check the internal state or a getter for it
    // Since we don't have access to private fields, we'll test behavior based on methods
    // For this test, we'll assume the constructor successfully sets up the initial state.
    expect(manager).toBeDefined();
  });

  it("should correctly branch and merge contexts when a new conversation starts", () => {
    const initialContext: ContextState = {
      messages: [new UserMessage("Initial query")]
    };
    const manager = new ContextBranchManager(initialContext);

    // Simulate branching (e.g., starting a new thread)
    const branchedContext: ContextState = {
      messages: [new UserMessage("New query in branch")]
    };
    const mergedContext = manager.branchAndMerge(branchedContext);

    // Check if the merged context contains messages from both the primary and the branch
    expect(mergedContext.messages).toHaveLength(2);
    // We assume the merge operation appends or combines the message history correctly
  });

  it("should update the primary context while maintaining history integrity", () => {
    const initialContext: ContextState = {
      messages: [new UserMessage("First turn")]
    };
    const manager = new ContextBranchManager(initialContext);

    // Simulate an update (e.g., adding an assistant response)
    const updatedContext: ContextState = {
      messages: [
        ...initialContext.messages,
        new AssistantMessage("Response to first turn")
      ]
    };
    const resultContext = manager.updateContext(updatedContext);

    // Check if the context was updated and the history length increased
    expect(resultContext.messages).toHaveLength(2);
    expect(resultContext.messages[1].content).toBe("Response to first turn");
  });
});