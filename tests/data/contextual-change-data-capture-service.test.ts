import { describe, it, expect, vi } from "vitest"
import { ContextualChangeDataCaptureService, OperationType, ChangeDataEvent, SourceMetadata } from "../src/data/contextual-change-data-capture-service"

describe("ContextualChangeDataCaptureService", () => {
  it("should initialize correctly and emit events on change", () => {
    const service = new ContextualChangeDataCaptureService()
    const mockEmitter = vi.spyOn(service["eventEmitter"], "emit")

    const sourceMetadata: SourceMetadata = {
      sourceId: "test-source",
      sourceName: "TestApp",
      timestamp: Date.now(),
    }
    const payload = { id: 1, name: "Test" }
    const event: ChangeDataEvent<{ id: number; name: string }> = {
      operation: "INSERT",
      payload: payload,
      metadata: sourceMetadata,
    }

    service.captureChange(event)

    expect(mockEmitter).toHaveBeenCalledWith("change", expect.objectContaining({
      operation: "INSERT",
      payload: payload,
      metadata: sourceMetadata,
    }))
  })

  it("should handle different operation types (UPDATE, DELETE)", () => {
    const service = new ContextualChangeDataCaptureService()
    const mockEmitter = vi.spyOn(service["eventEmitter"], "emit")

    const sourceMetadata: SourceMetadata = {
      sourceId: "test-source",
      sourceName: "TestApp",
      timestamp: Date.now(),
    }
    const updatePayload = { id: 2, name: "Updated" }
    const deletePayload = { id: 3 }

    const updateEvent: ChangeDataEvent<{ id: number; name: string }> = {
      operation: "UPDATE",
      payload: updatePayload,
      metadata: sourceMetadata,
    }
    const deleteEvent: ChangeDataEvent<{ id: number }> = {
      operation: "DELETE",
      payload: deletePayload,
      metadata: sourceMetadata,
    }

    service.captureChange(updateEvent)
    service.captureChange(deleteEvent)

    expect(mockEmitter).toHaveBeenCalledTimes(2)
    expect(mockEmitter).toHaveBeenCalledWith("change", expect.objectContaining({
      operation: "UPDATE",
      payload: updatePayload,
      metadata: sourceMetadata,
    }))
    expect(mockEmitter).toHaveBeenCalledWith("change", expect.objectContaining({
      operation: "DELETE",
      payload: deletePayload,
      metadata: sourceMetadata,
    }))
  })

  it("should pass the correct payload and metadata for captured changes", () => {
    const service = new ContextualChangeDataCaptureService()
    const mockEmitter = vi.spyOn(service["eventEmitter"], "emit")

    const sourceMetadata: SourceMetadata = {
      sourceId: "test-source",
      sourceName: "TestApp",
      timestamp: 1678886400000,
    }
    const payload = { id: 4, value: "TestValue" }
    const event: ChangeDataEvent<{ id: number; value: string }> = {
      operation: "INSERT",
      payload: payload,
      metadata: sourceMetadata,
    }

    service.captureChange(event)

    expect(mockEmitter).toHaveBeenCalledWith("change", {
      operation: "INSERT",
      payload: payload,
      metadata: sourceMetadata,
    })
  })
})