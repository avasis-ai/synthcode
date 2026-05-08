import { describe, it, expect } from "vitest";
import { PatternDetector, AnomalyReport } from "../src/anomaly/tool-usage-pattern-detector";

describe("PatternDetector", () => {
  it("should detect frequency anomalies when tool usage suddenly increases", () => {
    const config = {
      lookbackWindowSize: 5,
      frequencySensitivityThreshold: 2,
      sequenceSensitivityThreshold: 3,
    };
    const detector = new PatternDetector(config);

    // Simulate normal usage (low frequency)
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 100,
    });
    detector.processRecord({
      toolName: "toolB",
      toolInput: {},
      timestamp: 200,
    });

    // Simulate sudden burst (high frequency)
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 300,
    });
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 400,
    });
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 500,
    });

    const report = detector.detectAnomaly();

    expect(report.isAnomaly).toBe(true);
    expect(report.deviationType).toBe("frequency");
    expect(report.severity).toBe("medium");
  });

  it("should detect sequence anomalies when tool usage order changes unexpectedly", () => {
    const config = {
      lookbackWindowSize: 3,
      frequencySensitivityThreshold: 1,
      sequenceSensitivityThreshold: 1,
    };
    const detector = new PatternDetector(config);

    // Establish normal sequence: A -> B -> C
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 100,
    });
    detector.processRecord({
      toolName: "toolB",
      toolInput: {},
      timestamp: 200,
    });
    detector.processRecord({
      toolName: "toolC",
      toolInput: {},
      timestamp: 300,
    });

    // Simulate unexpected sequence: C -> A (breaking the pattern)
    detector.processRecord({
      toolName: "toolC",
      toolInput: {},
      timestamp: 400,
    });
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 500,
    });

    const report = detector.detectAnomaly();

    expect(report.isAnomaly).toBe(true);
    expect(report.deviationType).toBe("sequence");
    expect(report.severity).toBe("high");
  });

  it("should not detect an anomaly if usage remains within normal bounds", () => {
    const config = {
      lookbackWindowSize: 5,
      frequencySensitivityThreshold: 3,
      sequenceSensitivityThreshold: 2,
    };
    const detector = new PatternDetector(config);

    // Simulate steady, predictable usage
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 100,
    });
    detector.processRecord({
      toolName: "toolB",
      toolInput: {},
      timestamp: 200,
    });
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 300,
    });
    detector.processRecord({
      toolName: "toolB",
      toolInput: {},
      timestamp: 400,
    });
    detector.processRecord({
      toolName: "toolA",
      toolInput: {},
      timestamp: 500,
    });

    const report = detector.detectAnomaly();

    expect(report.isAnomaly).toBe(false);
    expect(report.deviationType).toBeUndefined();
  });
});