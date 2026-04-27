import { describe, it, expect } from "vitest";
import { CheckpointState, IStore, Checkpointer } from "../src/checkpointing/execution-checkpoint";

describe("Checkpointer", () => {
  it("should initialize with correct state", async () => {
    const mockStore: IStore = {
      save: vi.fn(),
      load: vi.fn(),
    };
    const checkpointer = new Checkpointer(mockStore);
    expect(checkpointer).toBeDefined();
  });

  it("should save the current state correctly", async () => {
    const mockStore: IStore = {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue(null),
    };
    const checkpointer = new Checkpointer(mockStore);
    const state: CheckpointState = {
      messages: [{ role: "user", content: "Test" }],
      context: { key: "value" },
      currentStep: 1,
      history: [],
      lastToolCallId: null,
    };
    await checkpointer.saveState(state);
    expect(mockStore.save).toHaveBeenCalledWith("checkpoint", expect.any(Object));
  });

  it("should load the state correctly", async () => {
    const mockStore: IStore = {
      save: vi.fn(),
      load: vi.fn().mockResolvedValue({
        messages: [{ role: "user", content: "Loaded" }],
        context: { loaded: true },
        currentStep: 2,
        history: [{ step: 1, input: {}, output: {} }],
        lastToolCallId: "tool-id",
      }),
    };
    const checkpointer = new Checkpointer(mockStore);
    const loadedState = await checkpointer.loadState();
    expect(mockStore.load).toHaveBeenCalledWith("checkpoint");
    expect(loadedState).toEqual({
      messages: [{ role: "user", content: "Loaded" }],
      context: { loaded: true },
      currentStep: 2,
      history: [{ step: 1, input: {}, output: {} }],
      lastToolCallId: "tool-id",
    });
  });
});