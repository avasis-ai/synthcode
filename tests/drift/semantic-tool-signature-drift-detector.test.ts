import { describe, it, expect } from "vitest"
import {
  SemanticToolSignatureDriftDetector,
  FieldEmbedding,
  ToolPayload,
  SemanticDriftReport,
} from "../semantic-tool-signature-drift-detector"

describe("SemanticToolSignatureDriftDetector", () => {
  it("should detect drift when the embedding distribution changes significantly", async () => {
    const detector = new SemanticToolSignatureDriftDetector(
      {
        embeddingService: {
          getEmbedding: async (text: string): Promise<Float32Array> => {
            if (text.includes("apple")) {
              return new Float32Array([0.1, 0.2])
            }
            return new Float32Array([0.9, 0.8])
          },
        },
        threshold: 0.5,
        minSamples: 5,
      }
    )

    const payload1: ToolPayload = {
      tool_id: "tool_a",
      input: {
        product: "apple",
        user_query: "I need an apple",
      },
      output: {
        result: "apple details",
      },
    }
    const payload2: ToolPayload = {
      tool_id: "tool_a",
      input: {
        product: "banana",
        user_query: "I need a banana",
      },
      output: {
        result: "banana details",
      },
    }

    // Simulate initial stable state (apple-like)
    const initialEmbeddings: FieldEmbedding[] = [
      {
        field_name: "product",
        tool_id: "tool_a",
        embedding: new Float32Array([0.1, 0.2]),
        cluster_id: "cluster_1",
        count: 1,
      },
    ]
    // Manually set the internal state for testing purposes (assuming the detector handles this)
    // In a real scenario, we'd call a 'train' or 'update_state' method.
    (detector as any).setInitialState = (embeddings: FieldEmbedding[]) => {
      (detector as any).embeddings = embeddings
    }
    (detector as any).setInitialState(initialEmbeddings)

    // Process a batch of data that introduces drift (banana-like)
    const driftReport = await detector.detectDrift([payload1, payload2])

    expect(driftReport.drift_detected).toBe(true)
    expect(driftReport.tool_id).toBe("tool_a")
  })

  it("should not detect drift if the input distribution remains stable", async () => {
    const detector = new SemanticToolSignatureDriftDetector(
      {
        embeddingService: {
          getEmbedding: async (text: string): Promise<Float32Array> => {
            return new Float32Array([0.1, 0.2])
          },
        },
        threshold: 0.5,
        minSamples: 5,
      }
    )

    const stablePayload: ToolPayload = {
      tool_id: "tool_b",
      input: {
        product: "apple",
        user_query: "I need an apple",
      },
      output: {
        result: "apple details",
      },
    }

    // Simulate initial stable state
    const initialEmbeddings: FieldEmbedding[] = [
      {
        field_name: "product",
        tool_id: "tool_b",
        embedding: new Float32Array([0.1, 0.2]),
        cluster_id: "cluster_1",
        count: 1,
      },
    ]
    (detector as any).setInitialState = (embeddings: FieldEmbedding[]) => {
      (detector as any).embeddings = embeddings
    }
    (detector as any).setInitialState(initialEmbeddings)

    // Process a batch of stable data
    const driftReport = await detector.detectDrift([stablePayload, stablePayload])

    expect(driftReport.drift_detected).toBe(false)
    expect(driftReport.tool_id).toBe("tool_b")
  })

  it("should handle multiple tools and report drift for the specific tool", async () => {
    const detector = new SemanticToolSignatureDriftDetector(
      {
        embeddingService: {
          getEmbedding: async (text: string): Promise<Float32Array> => {
            if (text.includes("tool_x")) {
              return new Float32Array([0.1, 0.2])
            }
            if (text.includes("tool_y")) {
              return new Float32Array([0.9, 0.8])
            }
            return new Float32Array([0.5, 0.5])
          },
        },
        threshold: 0.5,
        minSamples: 1,
      }
    )

    const driftToolPayload: ToolPayload = {
      tool_id: "tool_x",
      input: {
        query: "tool_x query",
      },
      output: {},
    }
    const stableToolPayload: ToolPayload = {
      tool_id: "tool_y",
      input: {
        query: "tool_y query",
      },
      output: {},
    }

    // Simulate initial state for tool_x (stable)
    const initialEmbeddings: FieldEmbedding[] = [
      {
        field_name: "query",
        tool_id: "tool_x",
        embedding: new Float32Array([0.1, 0.2]),
        cluster_id: "cluster_x",
        count: 1,
      },
    ]
    (detector as any).setInitialState = (embeddings: FieldEmbedding[]) => {
      (detector as any).embeddings = embeddings
    }
    (detector as any).setInitialState(initialEmbeddings)

    // Process mixed batch (drift for tool_x, stable for tool_y)
    const mixedBatch: ToolPayload[] = [
      {
        tool_id: "tool_y",
        input: {
          query: "tool_y query",
        },
        output: {},
      },
      {
        tool_id: "tool_x",
        input: {
          query: "tool_x query, but drifted",
        },
        output: {},
      },
    ]

    const driftReport = await detector.detectDrift(mixedBatch)

    // Since we only set the initial state for tool_x, we expect the report to focus on tool_x
    // and potentially report drift if the second item causes a change.
    expect(driftReport.drift_detected).toBe(true)
    expect(driftReport.tool_id).toBe("tool_x")
  })
})