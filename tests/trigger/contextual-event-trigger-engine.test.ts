import { describe, it, expect, vi } from "vitest"
import { ContextualEventTriggerEngine } from "../../../src/trigger/contextual-event-trigger-engine.js"

describe("ContextualEventTriggerEngine", () => {
    it("should initialize correctly with an event emitter", () => {
        const mockEmitter = {
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn(),
        }
        const engine = new ContextualEventTriggerEngine(mockEmitter)
        expect(engine).toBeDefined()
        expect(typeof engine.processEvent).toBe("function")
    })

    it("should process an external event and emit a corresponding internal event", () => {
        const mockEmitter = {
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn(),
        }
        const engine = new ContextualEventTriggerEngine(mockEmitter)
        const mockExternalEvent = {
            source: "api",
            status: "success",
            data: {
                user: "testuser",
                action: "login",
            },
        }
        engine.processEvent(mockExternalEvent)
        expect(mockEmitter.emit).toHaveBeenCalledWith("externalEvent", expect.objectContaining({
            source: "api",
            status: "success",
            data: {
                user: "testuser",
                action: "login",
            },
        }))
    })

    it("should handle multiple event types and constraints when processing an event", () => {
        const mockEmitter = {
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn(),
        }
        const engine = new ContextualEventTriggerEngine(mockEmitter)
        const mockExternalEvent = {
            source: "system",
            status: "failure",
            data: {
                error_code: 500,
                message: "Service unavailable",
            },
        }
        // Assuming the engine logic processes the event and potentially triggers multiple internal events
        engine.processEvent(mockExternalEvent)
        expect(mockEmitter.emit).toHaveBeenCalledTimes(1) // Adjust this count based on actual implementation
        expect(mockEmitter.emit).toHaveBeenCalledWith("systemFailure", expect.objectContaining({
            source: "system",
            status: "failure",
            data: {
                error_code: 500,
                message: "Service unavailable",
            },
        }))
    })
})