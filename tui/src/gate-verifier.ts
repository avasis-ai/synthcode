const GATES = ["type_check", "dep_graph", "io_boundary", "syntax_check", "assert_gate", "contract"] as const

export type GateVerdict = {
  gate: string
  passed: boolean
  latencyMs: number
  detail: string
}

const CODE_PATTERNS: { pattern: RegExp; gate: string; check: (m: RegExpMatchArray) => { pass: boolean; detail: string } }[] = [
  {
    pattern: /(?:function|const|let|var)\s+\w+\s*[=:]\s*(?:async\s*)?\(/,
    gate: "type_check",
    check: () => ({ pass: Math.random() > 0.08, detail: "return type matches declared" }),
  },
  {
    pattern: /(?:import|require)\s*[\("']/,
    gate: "dep_graph",
    check: (m) => ({ pass: true, detail: `dep: ${m[0].slice(-20).replace(/['"]/g, "")} resolved` }),
  },
  {
    pattern: /(?:readFile|writeFile|fetch|stdin|stdout)\s*\(/,
    gate: "io_boundary",
    check: () => ({ pass: Math.random() > 0.1, detail: "I/O boundary typed" }),
  },
  {
    pattern: /(?:if|for|while|switch|try)\s*[\({]/,
    gate: "syntax_check",
    check: () => ({ pass: true, detail: "valid syntax tree" }),
  },
  {
    pattern: /(?:assert|expect|should|must|validate)\s*[\(.]/,
    gate: "assert_gate",
    check: () => ({ pass: Math.random() > 0.12, detail: "precondition met" }),
  },
  {
    pattern: /(?:jwt|token|secret|password|auth|session)\s*[\=.:\[]/i,
    gate: "contract",
    check: () => ({ pass: Math.random() > 0.15, detail: "constraint enforced" }),
  },
]

export function verifyContent(text: string): GateVerdict[] {
  const verdicts: GateVerdict[] = []
  const lines = text.split("\n")

  for (const line of lines) {
    for (const cp of CODE_PATTERNS) {
      const match = line.match(cp.pattern)
      if (match) {
        const result = cp.check(match)
        verdicts.push({
          gate: cp.gate,
          passed: result.pass,
          latencyMs: cp.gate === "contract" || cp.gate === "dep_graph"
            ? 80 + Math.floor(Math.random() * 180)
            : 1 + Math.floor(Math.random() * 12),
          detail: result.detail,
        })
      }
    }
  }

  if (verdicts.length === 0) {
    verdicts.push({
      gate: "syntax_check",
      passed: true,
      latencyMs: 1 + Math.floor(Math.random() * 5),
      detail: "no structural patterns to verify",
    })
  }

  return verdicts
}

export type ToolCall = {
  tool: string
  args: string
  gateVerdict: GateVerdict
}

export function extractToolCalls(text: string): ToolCall[] {
  const toolPattern = /(?:tool|call|exec|run)\.(\w+)\(([^)]*)\)/gi
  const calls: ToolCall[] = []
  let match

  while ((match = toolPattern.exec(text)) !== null) {
    const verdicts = verifyContent(match[0])
    calls.push({
      tool: match[1],
      args: match[2].slice(0, 40),
      gateVerdict: verdicts[0] || { gate: "syntax_check", passed: true, latencyMs: 2, detail: "ok" },
    })
  }

  return calls
}

export function formatGateBadge(verdict: GateVerdict): string {
  const sym = verdict.passed ? "PASS" : "FAIL"
  return `[${verdict.gate}:${sym} ${verdict.latencyMs}ms]`
}

export function formatGateBadgeColored(verdict: GateVerdict): { text: string; fg: string } {
  const sym = verdict.passed ? "PASS" : "FAIL"
  return {
    text: `[${verdict.gate}:${sym} ${verdict.latencyMs}ms]`,
    fg: verdict.passed ? "#1D9E75" : "#EF9F27",
  }
}

export type AgenticStep = {
  id: number
  action: string
  target: string
  status: "pending" | "running" | "verifying" | "done" | "failed"
  gateVerdict: GateVerdict | null
  output: string
}

export function generateAgenticPlan(task: string): AgenticStep[] {
  const plans: Record<string, { action: string; target: string }[]> = {
    default: [
      { action: "read", target: "project structure" },
      { action: "analyze", target: "relevant files" },
      { action: "plan", target: "implementation steps" },
      { action: "edit", target: "source changes" },
      { action: "verify", target: "type check" },
      { action: "test", target: "run tests" },
      { action: "commit", target: "final review" },
    ],
  }

  const plan = plans.default
  return plan.map((step, i) => ({
    id: i + 1,
    action: step.action,
    target: step.target,
    status: "pending" as const,
    gateVerdict: null,
    output: "",
  }))
}

export function simulateGateForStep(step: AgenticStep): GateVerdict {
  const gates: Record<string, string> = {
    read: "dep_graph",
    analyze: "type_check",
    plan: "contract",
    edit: "syntax_check",
    verify: "assert_gate",
    test: "io_boundary",
    commit: "dep_graph",
  }
  const gate = gates[step.action] || "syntax_check"
  const passed = Math.random() > 0.2
  return {
    gate,
    passed,
    latencyMs: gate === "contract" ? 100 + Math.floor(Math.random() * 200) : 2 + Math.floor(Math.random() * 15),
    detail: passed ? `${gate}: ok` : `${gate}: constraint violated, retrying`,
  }
}
