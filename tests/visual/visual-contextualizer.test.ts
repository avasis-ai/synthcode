import { describe, it, expect } from "vitest";
import { VisualContextualizer, VisualInput, VisualContextPayload } from "../src/visual/visual-contextualizer";

describe("VisualContextualizer", () => {
  it("should generate a basic context payload from minimal input", () => {
    const input: VisualInput = {
      boundingBoxes: [{ x: 0, y: 0, width: 100, height: 100 }],
    };
    const contextualizer = new VisualContextualizer();
    const payload: VisualContextPayload = contextualizer.contextualize(input);

    expect(payload.nodes).toBeInstanceOf(Array);
    expect(payload.nodes.length).toBeGreaterThanOrEqual(0);
    expect(payload.summary).toBeDefined();
    expect(payload.spatialConstraints).toBeInstanceOf(Array);
  });

  it("should handle comprehensive input including OCR and bounding boxes", () => {
    const input: VisualInput = {
      imageData: "some_base64_image_data",
      boundingBoxes: [
        { x: 10, y: 20, width: 50, height: 30 },
        { x: 60, y: 20, width: 50, height: 30 },
      ],
      ocrResults: [
        { text: "Apple", boundingBox: { x: 10, y: 20, width: 50, height: 30 } },
        { text: "Banana", boundingBox: { x: 60, y: 20, width: 50, height: 30 } },
      ],
    };
    const contextualizer = new VisualContextualizer();
    const payload: VisualContextPayload = contextualizer.contextualize(input);

    expect(payload.summary).toContain("Apple");
    expect(payload.nodes.length).toBeGreaterThanOrEqual(2);
    expect(payload.spatialConstraints.length).toBeGreaterThanOrEqual(0);
  });

  it("should return empty or default values when input is empty", () => {
    const input: VisualInput = {};
    const contextualizer = new VisualContextualizer();
    const payload: VisualContextPayload = contextualizer.contextualize(input);

    expect(payload.nodes).toEqual([]);
    expect(payload.summary).toBe("");
    expect(payload.spatialConstraints).toEqual([]);
  });
});