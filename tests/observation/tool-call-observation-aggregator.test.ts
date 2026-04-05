import { describe, it, expect } from "vitest";
import { ToolCallObservationAggregator } from "../src/observation/tool-call-observation-aggregator";

describe("ToolCallObservationAggregator", () => {
  it("should add a basic observation correctly", () => {
    const aggregator = new ToolCallObservationAggregator();
    const source = "test-source";
    const payload = { result: "success" };
    aggregator.addObservation(source, payload);

    // Since we can't easily mock Date.now() to get an exact value,
    // we'll check the structure and that at least one observation exists.
    // A more robust test would mock time.
    // For this test, we assume addObservation adds one item.
    // We'll rely on the internal state being populated.
    // Note: Accessing private members like this is generally discouraged,
    // but necessary here to test the internal state based on the provided snippet.
    const privateObservations = (aggregator as any).observations;
    expect(privateObservations.length).toBe(1);
    expect(privateObservations[0].source).toBe(source);
    expect(privateObservations[0].payload).toEqual(payload);
    expect(typeof privateObservations[0].timestamp).toBe("number");
  });

  it("should accumulate multiple observations", () => {
    const aggregator = new ToolCallObservationAggregator();
    aggregator.addObservation("source1", { data: 1 });
    aggregator.addObservation("source2", { data: 2 });

    const privateObservations = (aggregator as any).observations;
    expect(privateObservations.length).toBe(2);
    expect(privateObservations[0].payload).toEqual({ data: 1 });
    expect(privateObservations[1].payload).toEqual({ data: 2 });
  });

  it("should add tool result messages when addToolResultMessage is called", () => {
    const aggregator = new ToolCallObservationAggregator();
    // Assuming addToolResultMessage adds an observation similar to addObservation
    // We need to call it to test its effect on the internal state.
    // Since the implementation for addToolResultMessage is incomplete,
    // we'll test that calling it increases the count, assuming it adds an observation.
    const mockToolResultMessage = {
      toolName: "mock-tool",
      result: "some result",
      // Add other necessary fields if ToolResultMessage is fully defined
    } as any;

    // We call it once to test the addition mechanism
    aggregator.addToolResultMessage(mockToolResultMessage);

    const privateObservations = (aggregator as any).observations;
    // If addToolResultMessage adds one observation, the count should be 1 (or 2 if we added one before)
    // Given the setup, we assume it adds one observation.
    expect(privateObservations.length).toBeGreaterThanOrEqual(1);
  });
});