import { describe, it, expect } from "vitest";
import {
    KnowledgeGapRemediationEngine,
    FailureReport,
    ConstraintPayload,
    TriplePayload,
} from "../remediation/knowledge-gap-remediation-engine.js";

describe("KnowledgeGapRemediationEngine", () => {
    it("should initialize correctly with an empty knowledge base", () => {
        const engine = new KnowledgeGapRemediationEngine();
        expect(engine).toBeInstanceOf(KnowledgeGapRemediationEngine);
        expect(engine.getKnowledgeBaseSize()).toBe(0);
    });

    it("should add a failure report and update the knowledge base", () => {
        const engine = new KnowledgeGapRemediationEngine();
        const report: FailureReport = {
            reportId: "R123",
            sourceContext: "ModuleA",
            observedFailure: "API endpoint failed due to missing auth key.",
            rootCauseAnalysis: "Authentication mechanism needs explicit key management.",
            severity: "CRITICAL",
        };

        engine.addFailureReport(report);

        expect(engine.getFailureReports()).toHaveLength(1);
        expect(engine.getKnowledgeBaseSize()).toBeGreaterThan(0);
    });

    it("should process and add constraint and triple payloads to the knowledge base", () => {
        const engine = new KnowledgeGapRemediationEngine();
        const constraint: ConstraintPayload = {
            constraintType: "NEGATION",
            description: "Service must not rely on deprecated libraries.",
            scope: "Backend",
            impactLevel: "HIGH",
        };
        const triple: TriplePayload = {
            subject: "User",
            predicate: "hasPermission",
            object: "READ_DATA",
            confidenceScore: 0.95,
        };

        engine.addConstraint(constraint);
        engine.addTriple(triple);

        expect(engine.getConstraints()).toHaveLength(1);
        expect(engine.getTriples()).toHaveLength(1);
        expect(engine.getKnowledgeBaseSize()).toBeGreaterThanOrEqual(2);
    });
});