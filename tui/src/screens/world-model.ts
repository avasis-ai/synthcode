import { BoxRenderable, TextRenderable, type CliRenderer } from "@opentui/core"

export type Invariant = {
  name: string
  gateType: string
  sizeBytes: number
  triggered: number
  lastTrigger: string
  status: "active" | "disabled"
}

export function generateInvariants(): { invs: Invariant[]; totalBytes: number } {
  const invs: Invariant[] = [
    { name: "jwt.exp > now()", gateType: "contract", sizeBytes: 512, triggered: 3, lastTrigger: "2s ago", status: "active" },
    { name: "return_type == declared_type", gateType: "type_check", sizeBytes: 2048, triggered: 12, lastTrigger: "0.5s ago", status: "active" },
    { name: "no_orphan_imports", gateType: "dep_graph", sizeBytes: 4096, triggered: 8, lastTrigger: "1s ago", status: "active" },
    { name: "write_needs_prior_read", gateType: "dep_graph", sizeBytes: 1024, triggered: 5, lastTrigger: "3s ago", status: "active" },
    { name: "no_cascade_destroy", gateType: "dep_graph", sizeBytes: 2048, triggered: 0, lastTrigger: "never", status: "active" },
    { name: "file_in_dependency_graph", gateType: "dep_graph", sizeBytes: 8192, triggered: 15, lastTrigger: "0.2s ago", status: "active" },
    { name: "stdin/stdout typed", gateType: "io_boundary", sizeBytes: 4096, triggered: 7, lastTrigger: "1.5s ago", status: "active" },
    { name: "no_shell_injection", gateType: "io_boundary", sizeBytes: 2048, triggered: 1, lastTrigger: "12s ago", status: "active" },
    { name: "valid_syntax_tree", gateType: "syntax_check", sizeBytes: 32768, triggered: 15, lastTrigger: "0.2s ago", status: "active" },
    { name: "no_unreachable_code", gateType: "syntax_check", sizeBytes: 8192, triggered: 2, lastTrigger: "8s ago", status: "active" },
    { name: "assert_precondition_met", gateType: "assert_gate", sizeBytes: 4096, triggered: 9, lastTrigger: "0.8s ago", status: "active" },
    { name: "postcondition_holds", gateType: "assert_gate", sizeBytes: 4096, triggered: 6, lastTrigger: "2s ago", status: "active" },
    { name: "consecutive_failure_cap(3)", gateType: "contract", sizeBytes: 512, triggered: 0, lastTrigger: "never", status: "active" },
    { name: "no_rewrite_after_failure", gateType: "contract", sizeBytes: 512, triggered: 0, lastTrigger: "never", status: "active" },
  ]
  const totalBytes = invs.reduce((sum, i) => sum + i.sizeBytes, 0)
  return { invs, totalBytes }
}

export function buildWorldModel(
  renderer: CliRenderer,
  invs: Invariant[],
  totalBytes: number,
  width: number,
): BoxRenderable {
  const root = new BoxRenderable(renderer, {
    id: "wm-root",
    flexDirection: "column",
    width: "auto",
    height: "auto",
    flexGrow: 1,
    padding: 1,
  })

  const maxBytes = 2 * 1024 * 1024
  const pct = totalBytes / maxBytes
  const barWidth = Math.max(10, width - 34)
  const filled = Math.min(barWidth, Math.floor(barWidth * pct))
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled)

  root.add(new TextRenderable(renderer, {
    id: "wm-header",
    content: " SYMBOLIC WORLD MODEL   2MB budget",
    fg: "#4A9FD8",
    attributes: 1,
  }))
  root.add(new TextRenderable(renderer, {
    id: "wm-sep1",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))
  root.add(new TextRenderable(renderer, {
    id: "wm-bar",
    content: ` model size  [${bar}]  ${Math.round(totalBytes / 1024)}kB / 2048kB  (${(pct * 100).toFixed(1)}%)`,
    fg: pct > 0.9 ? "#EF9F27" : "#1D9E75",
  }))
  root.add(new TextRenderable(renderer, {
    id: "wm-sep2",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  const fixedW = 14 + 8 + 10 + 12 + 10
  const invW = Math.max(10, width - fixedW - 4)

  root.add(new TextRenderable(renderer, {
    id: "wm-colhead",
    content: ` ${"GATE".padEnd(14)}  ${"INVARIANT".padEnd(invW)}  ${"SIZE".padEnd(8)}  ${"TRIGGERED".padEnd(10)}  ${"LAST".padEnd(12)}`,
    fg: "#555555",
  }))
  root.add(new TextRenderable(renderer, {
    id: "wm-sep3",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  const gateOrder = ["type_check", "dep_graph", "io_boundary", "syntax_check", "assert_gate", "contract"]
  const groups = new Map<string, Invariant[]>()
  invs.forEach(inv => {
    const list = groups.get(inv.gateType) || []
    list.push(inv)
    groups.set(inv.gateType, list)
  })

  for (const gate of gateOrder) {
    const list = groups.get(gate)
    if (!list) continue

    list.forEach((inv, i) => {
      const gateCol = i === 0 ? gate : ""
      const trigCol = inv.triggered > 0 ? `${inv.triggered}x` : "—"
      const trigFg = inv.triggered > 0 ? "#4A9FD8" : "#444444"
      const rowFg = inv.triggered > 0 ? "#1D9E75" : "#444444"
      const invName = inv.name.length > invW ? inv.name.slice(0, invW - 1) + "…" : inv.name

      root.add(new TextRenderable(renderer, {
        id: `wm-inv-${gate}-${i}`,
        content: ` ${gateCol.padEnd(14)}  ${invName.padEnd(invW)}  ${String(inv.sizeBytes).padStart(5)}B    ${trigCol.padEnd(10)}  ${inv.lastTrigger}`,
        fg: rowFg,
      }))
    })

    root.add(new TextRenderable(renderer, {
      id: `wm-gate-sep-${gate}`,
      content: " " + "╌".repeat(width - 4),
      fg: "#222222",
    }))
  }

  root.add(new TextRenderable(renderer, {
    id: "wm-footer",
    content: " w: world model   t: trust boundary   ↑↓: scroll   Esc: back",
    fg: "#444444",
  }))

  return root
}
