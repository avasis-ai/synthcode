import { describe, it, expect } from "vitest";
import {
  KnowledgeGraphReconciler,
  Triple,
  SourceTriple,
  ReconciliationReport,
} from "../src/graph/knowledge-graph-reconciler";

describe("KnowledgeGraphReconciler", () => {
  it("should correctly reconcile a set of non-conflicting triples", async () => {
    const reconciler = new KnowledgeGraphReconciler();
    const sourceTriples: SourceTriple[] = [
      {
        triple: { subject: "A", predicate: "has", object: "B" },
        source: "S1",
        authority: 1,
        timestamp: 100,
      },
      {
        triple: { subject: "C", predicate: "is", object: "D" },
        source: "S2",
        authority: 2,
        timestamp: 200,
      },
    ];

    const report: ReconciliationReport = await reconciler.reconcile(
      sourceTriples
    );

    expect(report.authoritativeTriples).toHaveLength(2);
    expect(report.conflictsResolved).toBe(0);
    expect(report.details.size).toBe(2);
  });

  it("should resolve conflicts by preferring the highest authority and latest timestamp", async () => {
    const reconciler = new KnowledgeGraphReconciler();
    const sourceTriples: SourceTriple[] = [
      // Conflict 1: Different objects for the same triple (A, has, ?)
      {
        triple: { subject: "A", predicate: "has", object: "B" },
        source: "S1",
        authority: 1,
        timestamp: 100,
      },
      {
        triple: { subject: "A", predicate: "has", object: "C" },
        source: "S2",
        authority: 5, // Higher authority
        timestamp: 300,
      },
      {
        triple: { subject: "A", predicate: "has", object: "B" },
        source: "S3",
        authority: 2,
        timestamp: 200,
      },
      // Conflict 2: Same triple, different sources
      {
        triple: { subject: "X", predicate: "is", object: "Y" },
        source: "S4",
        authority: 3,
        timestamp: 500,
      },
      {
        triple: { subject: "X", predicate: "is", object: "Y" },
        source: "S5",
        authority: 1,
        timestamp: 100,
      },
    ];

    const report: ReconciliationReport = await reconciler.reconcile(
      sourceTriples
    );

    // Expect 2 authoritative triples (one for A, one for X)
    expect(report.authoritativeTriples).toHaveLength(2);
    // One conflict (A, has, ?) resolved by S2, one conflict (X, is, Y) resolved by S4/S5 (but they are identical)
    // The conflict count should reflect the number of unique triples that had conflicting values.
    // In this setup, (A, has, ?) is the conflict.
    expect(report.conflictsResolved).toBe(1);

    // Check the conflict resolution for (A, has, ?)
    const conflictDetails = report.details.get("A|has|");
    expect(conflictDetails).toBeDefined();
    expect(conflictDetails!.resolvedTriple).toEqual({
      subject: "A",
      predicate: "has",
      object: "C",
    });
    expect(conflictDetails!.strategyUsed).toContain("highest authority");
    expect(conflictDetails!.sourcesCount).toBe(2);
  });

  it("should handle empty input gracefully", async () => {
    const reconciler = new KnowledgeGraphReconciler();
    const sourceTriples: SourceTriple[] = [];

    const report: ReconciliationReport = await reconciler.reconcile(
      sourceTriples
    );

    expect(report.authoritativeTriples).toHaveLength(0);
    expect(report.conflictsResolved).toBe(0);
    expect(report.details.size).toBe(0);
  });
});