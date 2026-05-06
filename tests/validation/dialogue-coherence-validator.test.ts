import { describe, it, expect } from "vitest"
import { DialogueCoherenceValidator } from "../src/validation/dialogue-coherence-validator"

describe("DialogueCoherenceValidator", () => {
    it("should pass validation for a coherent dialogue", () => {
        const validator = new DialogueCoherenceValidator(0.8)
        const dialogue = [
            { role: "user", content: "Hello, what is the capital of France?" },
            { role: "assistant", content: "The capital of France is Paris." }
        ]
        expect(() => validator.validate(dialogue)).not.toThrow()
    })

    it("should throw CoherenceViolation for contradictory statements", () => {
        const validator = new DialogueCoherenceValidator(0.8)
        const dialogue = [
            { role: "user", content: "I prefer apples." },
            { role: "assistant", content: "You stated you prefer bananas." }
        ]
        expect(() => validator.validate(dialogue)).toThrow("CoherenceViolation")
    })

    it("should throw CoherenceViolation if similarity is too low between turns", () => {
        const validator = new DialogueCoherenceValidator(0.9)
        const dialogue = [
            { role: "user", content: "Tell me about quantum physics." },
            { role: "assistant", content: "The color blue is a primary color." }
        ]
        expect(() => validator.validate(dialogue)).toThrow("CoherenceViolation")
    })
})