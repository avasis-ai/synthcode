import { BoxRenderable, TextRenderable, type CliRenderer } from "@opentui/core"
import { generateGateDecisions, type GateDecision } from "./gate-trace.js"

export interface ModelResult {
  name: string
  decisions: GateDecision[]
  passRate: number
  failRetry: number
  slowPath: number
  avgLatency: number
  status: "idle" | "running" | "done"
  rawOutput: string
}

export function computeModelResult(name: string, decisions: GateDecision[]): ModelResult {
  const total = decisions.length
  const passRate = total > 0 ? decisions.filter(d => d.decision !== "FAIL-RETRY").length / total : 0
  const failRetry = decisions.filter(d => d.decision === "FAIL-RETRY").length
  const slowPath = decisions.filter(d => d.decision === "VERIFIED").length
  const avgLatency = total > 0 ? Math.round(decisions.reduce((s, d) => s + d.latencyMs, 0) / total) : 0
  return { name, decisions, passRate, failRetry, slowPath, avgLatency, status: "idle", rawOutput: "" }
}

export function buildPlayground(
  renderer: CliRenderer,
  width: number,
  results: ModelResult[],
): BoxRenderable {
  const root = new BoxRenderable(renderer, {
    id: "pg-root",
    flexDirection: "column",
    width: "auto",
    height: "auto",
    flexGrow: 1,
    padding: 1,
  })

  root.add(new TextRenderable(renderer, {
    id: "pg-header",
    content: " PLAYGROUND   Model Gate Comparison",
    fg: "#4A9FD8",
    attributes: 1,
  }))
  root.add(new TextRenderable(renderer, {
    id: "pg-desc",
    content: " Same prompt, two models. Which passes the symbolic gate more reliably?",
    fg: "#888888",
  }))
  root.add(new TextRenderable(renderer, {
    id: "pg-sep1",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  const colW = Math.floor((width - 8) / 2)

  root.add(new TextRenderable(renderer, {
    id: "pg-models-head",
    content: ` ${"MODEL A".padEnd(colW)}  |  ${"MODEL B".padEnd(colW)}`,
    fg: "#555555",
  }))
  root.add(new TextRenderable(renderer, {
    id: "pg-sep2",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  results.forEach((m, idx) => {
    const label = idx === 0 ? "A" : "B"
    const nameTrunc = m.name.length > colW - 4 ? m.name.slice(0, colW - 5) + "..." : m.name

    if (m.status === "running") {
      root.add(new TextRenderable(renderer, {
        id: `pg-name-${label}`,
        content: ` ${nameTrunc}  [running...]`,
        fg: "#cccc00",
        attributes: 1,
      }))
    } else if (m.status === "done" && m.decisions.length > 0) {
      root.add(new TextRenderable(renderer, {
        id: `pg-name-${label}`,
        content: ` ${nameTrunc}`,
        fg: "#cccccc",
        attributes: 1,
      }))
      root.add(new TextRenderable(renderer, {
        id: `pg-pass-${label}`,
        content: `   Pass rate:   ${(m.passRate * 100).toFixed(1)}%`,
        fg: m.passRate > 0.9 ? "#1D9E75" : "#EF9F27",
      }))
      root.add(new TextRenderable(renderer, {
        id: `pg-fail-${label}`,
        content: `   FAIL-RETRY:  ${m.failRetry}`,
        fg: m.failRetry === 0 ? "#1D9E75" : "#EF9F27",
      }))
      root.add(new TextRenderable(renderer, {
        id: `pg-slow-${label}`,
        content: `   Slow path:   ${m.slowPath}x`,
        fg: "#4A9FD8",
      }))
      root.add(new TextRenderable(renderer, {
        id: `pg-lat-${label}`,
        content: `   Avg latency: ${m.avgLatency}ms`,
        fg: "#888888",
      }))

      const barW = Math.max(5, colW - 12)
      const passFill = Math.round(m.passRate * barW)
      root.add(new TextRenderable(renderer, {
        id: `pg-bar-${label}`,
        content: `   [${"#".repeat(passFill)}${"-".repeat(barW - passFill)}]`,
        fg: m.passRate > 0.9 ? "#1D9E75" : "#EF9F27",
      }))

      if (m.rawOutput) {
        const outTrunc = m.rawOutput.length > colW - 6 ? m.rawOutput.slice(0, colW - 7) + "..." : m.rawOutput
        root.add(new TextRenderable(renderer, {
          id: `pg-out-${label}`,
          content: `   >> ${outTrunc}`,
          fg: "#666666",
        }))
      }
    } else {
      root.add(new TextRenderable(renderer, {
        id: `pg-name-${label}`,
        content: ` ${nameTrunc}  [waiting]`,
        fg: "#555555",
      }))
    }

    if (idx === 0) {
      root.add(new TextRenderable(renderer, {
        id: "pg-div",
        content: " " + "─".repeat(width - 4),
        fg: "#222222",
      }))
    }
  })

  const doneResults = results.filter(r => r.status === "done" && r.decisions.length > 0)
  if (doneResults.length === 2) {
    const winner = doneResults[0].passRate >= doneResults[1].passRate ? doneResults[0] : doneResults[1]
    root.add(new TextRenderable(renderer, {
      id: "pg-sep3",
      content: " " + "─".repeat(width - 4),
      fg: "#333333",
    }))
    root.add(new TextRenderable(renderer, {
      id: "pg-verdict",
      content: ` Verdict: ${winner.name} passes the symbolic gate more reliably`,
      fg: "#1D9E75",
      attributes: 1,
    }))
  }

  root.add(new TextRenderable(renderer, {
    id: "pg-footer",
    content: " Enter: re-run   g: gate trace   Esc: back",
    fg: "#444444",
  }))

  return root
}
