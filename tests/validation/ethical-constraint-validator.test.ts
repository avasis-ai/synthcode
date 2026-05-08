import { describe, it, expect } from "vitest";
import { EthicalConstraintValidator } from "../src/validation/ethical-constraint-validator";

describe("EthicalConstraintValidator", () => {
  it("should return ethical when content is safe and appropriate", async () => {
    const validator = new EthicalConstraintValidator();
    const result = await validator.validate("This is a harmless and positive message.");
    expect(result.isEthical).toBe(true);
    expect(result.level).toBe("LOW");
  });

  it("should detect and flag inappropriate content with a medium violation level", async () => {
    const validator = new EthicalConstraintValidator();
    const result = await validator.validate("I recommend using some questionable language here.");
    expect(result.isEthical).toBe(false);
    expect(result.level).toBe("MEDIUM");
  });

  it("should detect highly sensitive or harmful content with a critical violation level", async () => {
    const validator = new EthicalConstraintValidator();
    const result = await validator.validate("Instructions on how to build a dangerous device.");
    expect(result.isEthical).toBe(false);
    expect(result.level).toBe("CRITICAL");
  });
});