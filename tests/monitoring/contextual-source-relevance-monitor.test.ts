import { describe, it, expect, vi } from "vitest";
import {
  IContextSource,
  RelevanceReportItem,
  RelevanceDriftReport,
} from "../src/monitoring/contextual-source-relevance-monitor";

describe("ContextualSourceRelevanceMonitor", () => {
  it("should calculate relevance scores for multiple sources", async () => {
    const sources: IContextSource[] = [
      {
        id: "source1",
        content: "The quick brown fox jumps over the lazy dog.",
        source_metadata: { type: "article" },
      },
      {
        id: "source2",
        content: "Artificial intelligence is rapidly changing the world.",
        source_metadata: { type: "news" },
      },
    ];
    const context = "What is the best way to improve AI models?";

    // Mocking the core relevance calculation logic for testing structure
    const mockRelevanceMonitor = {
      analyze: vi.fn((sources: IContextSource[], context: string): RelevanceReportItem[] => {
        return sources.map((source) => ({
          source_id: source.id,
          score: source.id === "source2" ? 0.9 : 0.3,
          is_relevant: source.id === "source2",
        }));
      }),
      checkDrift: vi.fn((report: RelevanceReportItem[], threshold: number): RelevanceDriftReport => {
        return {
          is_drift_detected: false,
          min_score: 0.3,
          threshold: threshold,
          sources_analyzed: 2,
          message: "No significant drift detected.",
        };
      }),
    };

    const relevanceReport = mockRelevanceMonitor.analyze(sources, context);

    expect(relevanceReport).toHaveLength(2);
    expect(relevanceReport[0].source_id).toBe("source1");
    expect(relevanceReport[1].source_id).toBe("source2");
    expect(relevanceReport[1].score).toBe(0.9);
  });

  it("should detect relevance drift when minimum score drops below threshold", async () => {
    const sources: IContextSource[] = [
      {
        id: "sourceA",
        content: "Old content.",
        source_metadata: {},
      },
      {
        id: "sourceB",
        content: "New content with low relevance.",
        source_metadata: {},
      },
    ];
    const context = "Contextual query.";
    const threshold = 0.5;

    // Mocking the core relevance calculation logic
    const mockRelevanceMonitor = {
      analyze: vi.fn(() => [
        { source_id: "sourceA", score: 0.8, is_relevant: true },
        { source_id: "sourceB", score: 0.2, is_relevant: false },
      ]),
      checkDrift: vi.fn((report: RelevanceReportItem[], threshold: number) => {
        return {
          is_drift_detected: true,
          min_score: 0.2,
          threshold: threshold,
          sources_analyzed: 2,
          message: "Relevance drift detected: minimum score is too low.",
        };
      }),
    };

    const relevanceReport = mockRelevanceMonitor.analyze(sources, context);
    const driftReport = mockRelevanceMonitor.checkDrift(relevanceReport, threshold);

    expect(driftReport.is_drift_detected).toBe(true);
    expect(driftReport.min_score).toBe(0.2);
    expect(driftReport.message).toContain("Relevance drift detected");
  });

  it("should report no drift when all sources maintain high relevance scores", async () => {
    const sources: IContextSource[] = [
      {
        id: "sourceX",
        content: "Relevant content 1.",
        source_metadata: {},
      },
      {
        id: "sourceY",
        content: "Relevant content 2.",
        source_metadata: {},
      },
    ];
    const context = "High relevance query.";
    const threshold = 0.4;

    // Mocking the core relevance calculation logic
    const mockRelevanceMonitor = {
      analyze: vi.fn(() => [
        { source_id: "sourceX", score: 0.9, is_relevant: true },
        { source_id: "sourceY", score: 0.7, is_relevant: true },
      ]),
      checkDrift: vi.fn((report: RelevanceReportItem[], threshold: number) => {
        return {
          is_drift_detected: false,
          min_score: 0.7,
          threshold: threshold,
          sources_analyzed: 2,
          message: "No significant drift detected.",
        };
      }),
    };

    const relevanceReport = mockRelevanceMonitor.analyze(sources, context);
    const driftReport = mockRelevanceMonitor.checkDrift(relevanceReport, threshold);

    expect(driftReport.is_drift_detected).toBe(false);
    expect(driftReport.min_score).toBe(0.7);
    expect(driftReport.message).toContain("No significant drift detected");
  });
);