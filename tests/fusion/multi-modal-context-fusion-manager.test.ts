import { describe, it, expect, vi } from "vitest";
import { MultiModalContextFusionManager, ModalityInput, ContextPayload, FusionStrategy } from "../src/fusion/multi-modal-context-fusion-manager.js";

describe("MultiModalContextFusionManager", () => {
  it("should initialize correctly with modality processors", async () => {
    const mockProcessor = vi.fn(() => Promise.resolve("processed_data"));
    const manager = new MultiModalContextFusionManager([
      { type: "image", processor: mockProcessor },
      { type: "text", processor: mockProcessor },
    ]);

    expect(manager).toBeInstanceOf(MultiModalContextFusionManager);
    // We can't easily test the internal map structure, but we can check if the methods exist
    expect(typeof (manager as any).processInputs).toBe("function");
  });

  it("should fuse multiple modality inputs into a unified context string", async () => {
    const manager = new MultiModalContextFusionManager([
      { type: "image", processor: vi.fn(() => Promise.resolve("image_context")) },
      { type: "text", processor: vi.fn(() => Promise.resolve("text_context")) },
    ]);

    const inputs: ModalityInput[] = [
      { type: "image", data: "image_data" },
      { type: "text", data: "text_data" },
    ];

    const fusedContext = await manager.processInputs(inputs);

    expect(fusedContext).toContain("image_context");
    expect(fusedContext).toContain("text_context");
    expect(fusedContext).toContain("fused context");
  });

  it("should incorporate existing context and metadata into the final payload", async () => {
    const mockProcessor = vi.fn(() => Promise.resolve("processed_data"));
    const manager = new MultiModalContextFusionManager([
      { type: "text", processor: mockProcessor },
    ]);

    const inputs: ModalityInput[] = [
      { type: "text", data: "new_text_input" },
    ];

    const existingContext: string = "Initial context.";
    const metadata: Record<string, any> = { source: "user", session_id: 123 };

    const payload = await manager.fuseContext(inputs, existingContext, metadata);

    expect(payload).toBeInstanceOf(ContextPayload);
    expect(payload.unifiedContext).toContain("new_text_input");
    expect(payload.unifiedContext).toContain("Initial context.");
    expect(payload.metadata).toEqual({ source: "user", session_id: 123 });
  });
});