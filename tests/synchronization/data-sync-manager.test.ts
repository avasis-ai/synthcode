import { describe, it, expect, vi } from "vitest"
import { DataSyncManager, SyncConflictStrategy } from "../src/synchronization/data-sync-manager.js"

describe("DataSyncManager", () => {
  it("should initialize correctly and manage state", async () => {
    const manager = new DataSyncManager()
    expect(manager).toBeDefined()
    expect(typeof manager.sourceId).toBe("string")
  })

  it("should handle data synchronization with lastWriteWins strategy", async () => {
    const manager = new DataSyncManager("sourceA")
    const initialData = { id: "1", name: "Old Name", value: 10 }
    const incomingData = { id: "1", name: "New Name", value: 20 }

    // Mock the external source interaction
    const mockSource = {
      get: vi.fn().mockResolvedValue(initialData),
      set: vi.fn().mockResolvedValue(null),
    }

    // Manually set the source for testing purposes
    (manager as any)._setSource = (mockSource as any)

    await manager.syncData(incomingData, "lastWriteWins")

    expect(mockSource.get).toHaveBeenCalledWith("1")
    expect(mockSource.set).toHaveBeenCalledWith(incomingData)
  })

  it("should handle conflict resolution using fieldLevelMerging strategy", async () => {
    const manager = new DataSyncManager("sourceB")
    const existingState = { id: "2", name: "Existing", details: { count: 5 } }
    const incomingData = { id: "2", name: "Updated", details: { count: 10, status: "active" } }

    // Mock the external source interaction
    const mockSource = {
      get: vi.fn().mockResolvedValue(existingState),
      set: vi.fn().mockResolvedValue(null),
    }

    (manager as any)._setSource = (mockSource as any)

    await manager.syncData(incomingData, "fieldLevelMerging")

    // Expect the merged data to be set
    const expectedMergedData = {
      id: "2",
      name: "Updated",
      details: { count: 10, status: "active" },
    }

    expect(mockSource.get).toHaveBeenCalledWith("2")
    expect(mockSource.set).toHaveBeenCalledWith(expectedMergedData)
  })
})