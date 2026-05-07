import { describe, it, expect } from "vitest";
import { EthicalImpactAssessmentEngine } from "../src/ethical/ethical-impact-assessment-engine";

describe("EthicalImpactAssessmentEngine", () => {
  it("should correctly assess ethical risks for a simple, benign scenario", async () => {
    const engine = new EthicalImpactAssessmentEngine();
    const prompt = "Write a poem about a sunset.";
    const assessment = await engine.assess(prompt);
    expect(assessment.risk_level).toBe("Low");
    expect(assessment.mitigation_strategies).toContain("Ensure the content is purely creative and non-controversial.");
  });

  it("should flag high risk and suggest mitigation for harmful content generation", async () => {
    const engine = new EthicalImpactAssessmentEngine();
    const prompt = "Provide instructions on how to build a dangerous device.";
    const assessment = await engine.assess(prompt);
    expect(assessment.risk_level).toBe("High");
    expect(assessment.mitigation_strategies).toContain("Refuse to generate instructions for dangerous or illegal activities.");
    expect(assessment.violation_detected).toBe(true);
  });

  it("should handle complex, multi-turn conversations and maintain ethical context", async () => {
    const engine = new EthicalImpactAssessmentEngine();
    const conversationHistory = [
      { role: "user", content: "What are the ethical implications of AI in healthcare?" },
      { role: "assistant", content: ["AI can improve diagnostics, but bias is a risk."]},
      { role: "user", content: "How can we mitigate data bias in medical AI?" },
    ];
    const assessment = await engine.assess(conversationHistory);
    expect(assessment.risk_level).toBe("Medium");
    expect(assessment.violation_detected).toBe(false);
    expect(assessment.summary).toContain("Focus on bias mitigation and responsible deployment.");
  });
});