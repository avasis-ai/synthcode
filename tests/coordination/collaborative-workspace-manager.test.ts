import { describe, it, expect } from "vitest"
import {
  WorkspaceState,
  Mutation,
  Conflict,
  CollaborativeWorkspaceManager,
} from "../src/coordination/collaborative-workspace-manager"

describe("CollaborativeWorkspaceManager", () => {
  it("should initialize with a valid initial state", () => {
    const initialState: WorkspaceState = {
      version: 0,
      lastUpdated: Date.now(),
      resources: {
        docId: "initial_doc",
      },
      history: [],
    }
    const manager = new CollaborativeWorkspaceManager(initialState)
    expect(manager).toBeDefined()
    expect(manager.getState()).toEqual(initialState)
  })

  it("should apply a mutation and update state correctly", async () => {
    const initialState: WorkspaceState = {
      version: 1,
      lastUpdated: Date.now(),
      resources: {
        docId: "initial_doc",
        settings: {
          theme: "dark",
        },
      },
      history: [
        {
          version: 1,
          timestamp: Date.now(),
          mutatorId: "userA",
          description: "Initial setup",
        },
      ],
    }
    const manager = new CollaborativeWorkspaceManager(initialState)
    const mutation: Mutation = {
      resourceId: "settings",
      payload: {
        theme: "light",
      },
      description: "Changed theme",
    }

    await manager.applyMutation(mutation, "userB")

    const newState = manager.getState()
    expect(newState.version).toBe(2)
    expect(newState.resources.settings).toEqual({
      theme: "light",
    })
    expect(newState.history).toHaveLength(2)
    expect(newState.history[1].mutatorId).toBe("userB")
  })

  it("should detect and handle conflicts when applying mutations", async () => {
    const initialState: WorkspaceState = {
      version: 1,
      lastUpdated: Date.now(),
      resources: {
        docId: "initial_doc",
        counter: 10,
      },
      history: [
        {
          version: 1,
          timestamp: Date.now(),
          mutatorId: "userA",
          description: "Initial setup",
        },
      ],
    }
    const manager = new CollaborativeWorkspaceManager(initialState)

    // Simulate a conflict: trying to change counter from 10 to 20, but the current state is 11
    const conflictingMutation: Mutation = {
      resourceId: "counter",
      payload: 20,
      description: "Attempted increment",
    }

    // We assume the manager checks the version before applying the mutation
    // For this test, we simulate the conflict detection logic
    const conflict = await manager.applyMutation(
      conflictingMutation,
      "userC",
      { expectedVersion: 2 } // Simulate the expected version check failing
    )

    expect(conflict).toBeInstanceOf(Conflict)
    expect(conflict.resourceId).toBe("counter")
    expect(conflict.currentValue).toBe(10) // Current value based on initial state
    expect(conflict.proposedValue).toBe(20)
    expect(conflict.message).toContain("Conflict detected")
  })
})