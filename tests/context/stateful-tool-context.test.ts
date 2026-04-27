import { describe, it, expect, vi } from "vitest";
import { StatefulToolContext } from "../src/context/stateful-tool-context";
import { Store } from "../src/context/stateful-tool-context.types";

describe("StatefulToolContext", () => {
  let mockStore: Store;
  let context: StatefulToolContext;

  beforeEach(() => {
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
    };
    context = new StatefulToolContext(mockStore);
  });

  it("should initialize correctly with the provided store", async () => {
    await context.initialize();
    expect(mockStore.get).toHaveBeenCalledWith("toolContext");
  });

  it("should save and retrieve the state correctly", async () => {
    const initialState = {
      toolId: "testTool",
      lastUpdated: Date.now(),
      inputs: { query: "test" },
      intermediateOutputs: {},
      executionSteps: [],
      contextMessages: [],
      version: 1,
    };
    
    mockStore.get.mockResolvedValue(initialState);
    
    await context.initialize();
    expect(mockStore.get).toHaveBeenCalledWith("toolContext");

    // Simulate updating the state
    const newState = { ...initialState, version: 2, contextMessages: [{ role: "user", content: "new message" }] };
    await context.updateState(newState);

    expect(mockStore.set).toHaveBeenCalledWith("toolContext", expect.objectContaining({ version: 2 }));
  });

  it("should handle updates when the initial state is null", async () => {
    mockStore.get.mockResolvedValue(null);
    
    await context.initialize();
    
    const newState = {
      toolId: "newTool",
      lastUpdated: Date.now(),
      inputs: { initial: true },
      intermediateOutputs: {},
      executionSteps: [],
      contextMessages: [],
      version: 1,
    };

    await context.updateState(newState);
    expect(mockStore.set).toHaveBeenCalledWith("toolContext", expect.objectContaining({ toolId: "newTool" }));
  });
});