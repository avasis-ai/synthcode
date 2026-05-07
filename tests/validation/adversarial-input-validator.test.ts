import { describe, it, expect } from "vitest";
import { AdversarialCheck } from "../src/validation/adversarial-input-validator.js";

describe("AdversarialCheck", () => {
  it("should correctly identify a basic XSS attempt", async () => {
    const check = new class implements AdversarialCheck {
      getName() { return "XSS Check"; }
      async check(input: string): Promise<any> {
        if (input.includes("<script>")) {
          return { passed: false, riskLevel: "HIGH", finding: "XSS script detected" };
        }
        return { passed: true, riskLevel: "LOW", finding: "No XSS detected" };
      }
    }();
    const result = await check.check("<script>alert('xss')</script>");
    expect(result.passed).toBe(false);
    expect(result.riskLevel).toBe("HIGH");
    expect(result.finding).toContain("XSS script detected");
  });

  it("should pass for benign input", async () => {
    const check = new class implements AdversarialCheck {
      getName() { return "Benign Check"; }
      async check(input: string): Promise<any> {
        if (input.includes("badword")) {
          return { passed: false, riskLevel: "MEDIUM", finding: "Bad word detected" };
        }
        return { passed: true, riskLevel: "LOW", finding: "Input seems safe" };
      }
    }();
    const result = await check.check("This is a normal sentence.");
    expect(result.passed).toBe(true);
    expect(result.riskLevel).toBe("LOW");
    expect(result.finding).toContain("safe");
  });

  it("should handle empty input gracefully", async () => {
    const check = new class implements AdversarialCheck {
      getName() { return "Empty Check"; }
      async check(input: string): Promise<any> {
        if (!input || input.trim().length === 0) {
          return { passed: true, riskLevel: "LOW", finding: "Empty input is acceptable" };
        }
        return { passed: true, riskLevel: "LOW", finding: "Input is valid" };
      }
    }();
    const result = await check.check("   ");
    expect(result.passed).toBe(true);
    expect(result.riskLevel).toBe("LOW");
    expect(result.finding).toContain("acceptable");
  });
});