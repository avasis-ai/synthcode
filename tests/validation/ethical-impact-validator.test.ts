import { describe, it, expect } from "vitest"
import { EthicalImpactValidator } from "../src/validation/ethical-impact-validator"

describe("EthicalImpactValidator", () => {
    it("should correctly identify low risk when content is benign", () => {
        const validator = new EthicalImpactValidator()
        const result = validator.validate("The sky is blue and the grass is green.")
        expect(result.overallRiskLevel).toBe("LOW")
        expect(result.checks).toHaveLength(3)
    })

    it("should identify high risk when content promotes hate speech", () => {
        const validator = new EthicalImpactValidator()
        const result = validator.validate("Group X should be eliminated for the good of society.")
        expect(result.overallRiskLevel).toBe("HIGH")
        const hateSpeechCheck = result.checks.find(c => c.checkName === "HateSpeechCheck")
        expect(hateSpeechCheck?.isEthical).toBe(false)
        expect(hateSpeechCheck?.severity).toBe("HIGH")
    })

    it("should identify medium risk when content contains sensitive personal information", () => {
        const validator = new EthicalImpactValidator()
        const result = validator.validate("My name is John Doe, and my SSN is 123-45-6789.")
        expect(result.overallRiskLevel).toBe("MEDIUM")
        const piiCheck = result.checks.find(c => c.checkName === "PII_Check")
        expect(piiCheck?.isEthical).toBe(false)
        expect(piiCheck?.severity).toBe("MEDIUM")
    })
})