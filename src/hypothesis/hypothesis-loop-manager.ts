import { EventEmitter } from "node:events"

export type Message = { role: "user"; content: string } | { role: "assistant"; content: string[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean }

export type ContentBlock = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "thinking"; thinking: string }

export interface Hypothesis {
  id: string
  hypothesis: string
  expected_outcome: string
  required_evidence: string
}

export type LoopState = "PENDING" | "TESTING" | "NEEDS_REFINEMENT" | "CONFIRMED" | "REJECTED"

export interface LoopContext {
  history: Message[]
  current_state: LoopState
  evidence_gathered: string[]
}

export class HypothesisLoopManager extends EventEmitter {
  private currentHypothesis: Hypothesis | null = null
  private context: LoopContext

  constructor(initialContext: LoopContext) {
    super()
    this.context = {
      history: initialContext.history,
      current_state: initialContext.current_state,
      evidence_gathered: initialContext.evidence_gathered
    }
  }

  createHypothesis(hypothesis: Hypothesis): void {
    if (this.currentHypothesis) {
      console.warn("Overwriting existing hypothesis.")
    }
    this.currentHypothesis = hypothesis
    this.context.current_state = "PENDING"
    this.emit("hypothesis_created", hypothesis)
  }

  runTest(context: LoopContext): { result: string; evidence: string } | null {
    if (!this.currentHypothesis) {
      throw new Error("Cannot run test: No hypothesis defined.")
    }

    this.context = { ...context, current_state: "TESTING" }

    // Simulate running a test based on the hypothesis
    const testResult = `Test executed successfully against hypothesis: ${this.currentHypothesis.hypothesis}. Initial findings suggest ${Math.random() > 0.5 ? "support" : "contradiction"}.`
    const evidence = `Test evidence gathered: ${testResult}`

    this.context.evidence_gathered.push(evidence)
    this.emit("test_run", { result: testResult, evidence: evidence })

    return { result: testResult, evidence: evidence }
  }

  refine(result: string, context: LoopContext): { new_hypothesis: Hypothesis; next_state: LoopState } {
    if (!this.currentHypothesis) {
      throw new Error("Cannot refine: No hypothesis defined.")
    }

    this.context = { ...context, current_state: "NEEDS_REFINEMENT" }

    // Logic to determine if refinement is needed and what the next hypothesis should be
    const isConfirmed = result.toLowerCase().includes("strong support")
    const isRejected = result.toLowerCase().includes("strong contradiction")

    let nextState: LoopState
    let newHypothesis: Hypothesis

    if (isConfirmed) {
      nextState = "CONFIRMED"
      newHypothesis = {
        id: "final",
        hypothesis: this.currentHypothesis.hypothesis,
        expected_outcome: "Confirmed",
        required_evidence: "Sufficient evidence gathered."
      }
    } else if (isRejected) {
      nextState = "REJECTED"
      newHypothesis = {
        id: "rejected",
        hypothesis: "Hypothesis rejected.",
        expected_outcome: "Null",
        required_evidence: "Contradictory evidence found."
      }
    } else {
      nextState = "PENDING"
      newHypothesis = {
        id: "refined",
        hypothesis: `Refinement based on results: ${result}.`,
        expected_outcome: "Further testing required.",
        required_evidence: "More targeted evidence."
      }
    }

    this.currentHypothesis = newHypothesis
    this.context.current_state = nextState
    this.emit("hypothesis_refined", newHypothesis)

    return { new_hypothesis: newHypothesis, next_state: nextState }
  }

  getCurrentState(): LoopContext {
    return this.context
  }
}