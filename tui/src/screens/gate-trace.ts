import { BoxRenderable, TextRenderable, type CliRenderer } from "@opentui/core"

export type GateDecision = {
  step: string
  neuralOut: string
  gateType: string
  decision: "PASS" | "FAIL-RETRY" | "VERIFIED"
  latencyMs: number
  retryCount: number
}

export function generateGateDecisions(): GateDecision[] {
  const gates = ["type_check", "dep_graph", "io_boundary", "syntax_check", "assert_gate", "contract"]
  const steps = [
    "plan.parse", "plan.validate", "tool.edit(3)", "tool.edit(7)", "tool.read(1)",
    "tool.edit(12)", "tool.write(src/auth.ts)", "tool.edit(24)", "verify.compile", "verify.test",
    "tool.edit(31)", "tool.read(5)", "plan.finalize", "tool.edit(44)", "verify.lint",
  ]
  const outputs = [
    "generate token handler", "refactor auth middleware", "add JWT expiry check",
    "update imports", "fix type annotation", "add error boundary", "refactor DB query",
    "add validation", "fix async await", "add test case", "update schema",
    "fix null check", "finalize plan", "add rate limiter", "fix lint error",
  ]
  return steps.map((step, i) => {
    const gate = gates[i % gates.length]
    const isFail = i === 3 || i === 7 || i === 11
    const isSlow = gate === "contract" || gate === "dep_graph"
    return {
      step,
      neuralOut: outputs[i] || "output",
      gateType: gate,
      decision: isFail ? "FAIL-RETRY" as const : isSlow ? "VERIFIED" as const : "PASS" as const,
      latencyMs: isSlow ? 120 + Math.floor(Math.random() * 200) : 2 + Math.floor(Math.random() * 15),
      retryCount: isFail ? 1 + Math.floor(Math.random() * 2) : 0,
    }
  })
}

export function buildGateTrace(
  renderer: CliRenderer,
  decisions: GateDecision[],
  filter: string,
  width: number,
  height: number,
  liveIdx: number = -1,
): BoxRenderable {
  const root = new BoxRenderable(renderer, {
    id: "gt-root",
    flexDirection: "column",
    width: "auto",
    height: "auto",
    flexGrow: 1,
    padding: 1,
  })

  const visible = filter === ""
    ? decisions
    : decisions.filter(d => filter === "FAIL-RETRY" ? d.decision === "FAIL-RETRY" : d.gateType === filter)

  const totalPass = decisions.filter(d => d.decision === "PASS").length
  const totalFail = decisions.filter(d => d.decision === "FAIL-RETRY").length
  const totalVerified = decisions.filter(d => d.decision === "VERIFIED").length
  const avgLatency = Math.round(decisions.reduce((s, d) => s + d.latencyMs, 0) / (decisions.length || 1))
  const passRate = ((totalPass + totalVerified) / (decisions.length || 1) * 100).toFixed(1)

  root.add(new TextRenderable(renderer, {
    id: "gt-header",
    content: ` GATE TRACE   session s-042   ${decisions.length} steps`,
    fg: "#4A9FD8",
    attributes: 1,
  }))

  root.add(new TextRenderable(renderer, {
    id: "gt-sep1",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  root.add(new TextRenderable(renderer, {
    id: "gt-stats",
    content: ` ${passRate}% pass   ${totalFail} FAIL-RETRY   avg ${avgLatency}ms   slow path x${totalVerified}`,
    fg: totalFail === 0 ? "#1D9E75" : "#EF9F27",
  }))

  root.add(new TextRenderable(renderer, {
    id: "gt-sep2",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  const stepW = 22
  const gateW = 14
  const decW = 14
  const latW = 8
  const sepW = 7
  const neuralW = Math.max(10, width - stepW - gateW - decW - latW - sepW - 6)

  root.add(new TextRenderable(renderer, {
    id: "gt-colhead",
    content: ` ${"STEP".padEnd(stepW)} │ ${"NEURAL OUTPUT".padEnd(neuralW)} │ ${"GATE".padEnd(gateW)} │ ${"DECISION".padEnd(decW)} │ ${"LATENCY".padEnd(latW)}`,
    fg: "#555555",
  }))
  root.add(new TextRenderable(renderer, {
    id: "gt-sep3",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  const maxRows = height - 8
  const start = Math.max(0, visible.length - maxRows)

  for (let i = start; i < visible.length; i++) {
    const d = visible[i]
    const isLive = i === liveIdx
    let decStr: string
    let decFg: string
    if (isLive) { decStr = ">> RUNNING"; decFg = "#cccc00" }
    else if (d.decision === "PASS") { decStr = "● PASS"; decFg = "#1D9E75" }
    else if (d.decision === "FAIL-RETRY") { decStr = "↻ FAIL-RETRY"; decFg = "#EF9F27" }
    else { decStr = "✓ VERIFIED"; decFg = "#085041" }

    const latStr = isLive ? "..." : `${d.latencyMs}ms`
    const latFg = isLive ? "#cccc00" : d.latencyMs > 100 ? "#EF9F27" : "#444444"

    const neuralTrunc = d.neuralOut.length > neuralW ? d.neuralOut.slice(0, neuralW - 1) + "..." : d.neuralOut

    const rowFg = isLive ? "#cccc00" : "#cccccc"
    root.add(new TextRenderable(renderer, {
      id: `gt-row-${i}`,
      content: ` ${d.step.padEnd(stepW)} | ${neuralTrunc.padEnd(neuralW)} | ${d.gateType.padEnd(gateW)} | ${decStr.padEnd(decW)} | ${latStr}`,
      fg: rowFg,
    }))

    if (d.decision === "FAIL-RETRY" && d.retryCount > 0) {
      root.add(new TextRenderable(renderer, {
        id: `gt-retry-${i}`,
        content: ` ${"".padEnd(stepW)}   ${"".padEnd(neuralW)}   ${"".padEnd(gateW)}   retry #${d.retryCount} -> resolved`,
        fg: "#085041",
      }))
    }
  }

  root.add(new TextRenderable(renderer, {
    id: "gt-footer",
    content: ` filter: "${filter || "none"}"   f: filter   r: FAIL-RETRY only   c: clear   ↑↓: scroll`,
    fg: "#444444",
  }))

  return root
}
