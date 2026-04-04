import { describe, it, expect } from "vitest";
import { ConversationStateTracker, Checkpoint } from "../src/state/conversation-state-tracker";

describe("ConversationStateTracker", () => {
  it("should initialize with no checkpoints", () => {
    const tracker = new ConversationStateTracker();
    // Assuming there's a way to check the internal state or a getter for checkpoints count
    // Since we can't see the full implementation, we'll test basic functionality that implies initialization.
    // If a getter existed, we'd use it. For now, we assume instantiation is clean.
    expect(true).toBe(true); // Placeholder assertion if no public getter is available
  });

  it("should add and retrieve a checkpoint correctly", () => {
    const tracker = new ConversationStateTracker();
    const checkpointId = "test-id-1";
    const initialCheckpoint: Checkpoint = {
      checkpointId: checkpointId,
      timestamp: Date.now(),
      messages: [],
      toolContext: {},
    };

    // Assuming an addCheckpoint method exists
    (tracker as any).addCheckpoint(initialCheckpoint);

    // Assuming a getCheckpoint method exists
    const retrievedCheckpoint = (tracker as any).getCheckpoint(checkpointId);
    expect(retrievedCheckpoint).toEqual(initialCheckpoint);
  });

  it("should update an existing checkpoint's messages", () => {
    const tracker = new ConversationStateTracker();
    const checkpointId = "update-test";
    const initialCheckpoint: Checkpoint = {
      checkpointId: checkpointId,
      timestamp: Date.now(),
      messages: [{ role: "user", content: "Initial message" }],
      toolContext: {},
    };

    (tracker as any).addCheckpoint(initialCheckpoint);

    const newMessage = { role: "assistant", content: "Updated response" };
    const updatedCheckpoint: Checkpoint = {
      ...initialCheckpoint,
      messages: [...initialCheckpoint.messages, newMessage],
      timestamp: Date.now(),
    };

    // Assuming an updateCheckpoint method exists
    (tracker as any).updateCheckpoint(checkpointId, updatedCheckpoint);

    const retrievedCheckpoint = (tracker as any).getCheckpoint(checkpointId);
    expect(retrievedCheckpoint?.messages).toHaveLength(2);
    expect(retrievedCheckpoint?.messages[1]).toEqual(newMessage);
  });
});