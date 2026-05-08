import { describe, it, expect } from "vitest"
import { ArgumentationEngine, Premise, Argument, DebateContext } from "../src/argumentation/argumentation-engine.js"

describe("ArgumentationEngine", () => {
  it("should initialize correctly with a basic context", () => {
    const initialContext: DebateContext = {
      initialClaim: "The sky is blue.",
      participants: ["Alice", "Bob"],
      premises: [
        {
          id: "p1",
          claim: "The sky is blue.",
          evidenceWeight: 0.9,
          supportingArguments: [],
          contradictoryArguments: [],
        },
      ],
      history: [],
    }
    const engine = new ArgumentationEngine(initialContext)
    expect(engine).toBeInstanceOf(ArgumentationEngine)
  })

  it("should generate a basic argument when given a premise and context", () => {
    const initialContext: DebateContext = {
      initialClaim: "AI will revolutionize education.",
      participants: ["Teacher", "Student"],
      premises: [
        {
          id: "p1",
          claim: "AI improves personalized learning.",
          evidenceWeight: 0.8,
          supportingArguments: [],
          contradictoryArguments: [],
        },
      ],
      history: [],
    }
    const engine = new ArgumentationEngine(initialContext)
    const argument = engine.generateArgument("p1", "AI improves personalized learning.", "Personalized learning is measurable.", ["A1", "A2"], [])
    expect(argument.claim).toBe("AI improves personalized learning.")
    expect(argument.source).toBe("p1")
    expect(argument.support).toEqual(["A1", "A2"])
  })

  it("should update the context history after processing an argument", () => {
    const initialContext: DebateContext = {
      initialClaim: "Climate change is real.",
      participants: ["Scientist", "Skeptic"],
      premises: [
        {
          id: "p1",
          claim: "Global temperatures are rising.",
          evidenceWeight: 0.95,
          supportingArguments: [],
          contradictoryArguments: [],
        },
      ],
      history: [{
        sender: "Scientist",
        message: "Global temperatures are rising.",
        timestamp: Date.now(),
      }],
    }
    const engine = new ArgumentationEngine(initialContext)
    const newArgument = {
      source: "p1",
      claim: "Global temperatures are rising.",
      evidence: "Data shows rising CO2 levels.",
      support: [],
      contradiction: [],
    }
    engine.processArgument(newArgument)
    expect(engine.context.history.length).toBe(2)
    expect(engine.context.history[1].sender).toBe("ArgumentationEngine")
  })
})