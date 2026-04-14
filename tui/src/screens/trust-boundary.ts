import { BoxRenderable, TextRenderable, type CliRenderer } from "@opentui/core"

interface TrustZone {
  category: string
  items: { name: string; enforced: boolean; description: string }[]
}

const TRUST_ZONES: TrustZone[] = [
  {
    category: "INSIDE — Symbolically Enforced",
    items: [
      { name: "type_check", enforced: true, description: "Return types match declarations" },
      { name: "dep_graph", enforced: true, description: "Write needs prior read, no cascade destroy" },
      { name: "io_boundary", enforced: true, description: "stdin/stdout typed, no shell injection" },
      { name: "syntax_check", enforced: true, description: "Valid syntax tree, no unreachable code" },
      { name: "assert_gate", enforced: true, description: "Pre/postconditions verified" },
      { name: "contract", enforced: true, description: "Business constraints enforced (jwt.exp, failure cap)" },
    ],
  },
  {
    category: "OUTSIDE — Monitored, NOT Enforced",
    items: [
      { name: "semantic_correctness", enforced: false, description: "Does the code do what the user asked?" },
      { name: "business_logic", enforced: false, description: "Is the business rule correct?" },
      { name: "domain_accuracy", enforced: false, description: "Is the domain model accurate?" },
      { name: "user_intent", enforced: false, description: "Did we understand what the user wants?" },
      { name: "performance", enforced: false, description: "Is the solution performant enough?" },
      { name: "security_audit", enforced: false, description: "Full security review beyond structural checks" },
    ],
  },
]

export function buildTrustBoundary(
  renderer: CliRenderer,
  width: number,
): BoxRenderable {
  const root = new BoxRenderable(renderer, {
    id: "tb-root",
    flexDirection: "column",
    width: "auto",
    height: "auto",
    flexGrow: 1,
    padding: 1,
  })

  root.add(new TextRenderable(renderer, {
    id: "tb-header",
    content: " TRUST BOUNDARY   Architectural Honesty",
    fg: "#4A9FD8",
    attributes: 1,
  }))

  root.add(new TextRenderable(renderer, {
    id: "tb-desc",
    content: " What the symbolic model enforces vs what it does not. This distinction IS the product.",
    fg: "#888888",
  }))

  root.add(new TextRenderable(renderer, {
    id: "tb-sep0",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  for (const zone of TRUST_ZONES) {
    const isInside = zone.items[0]?.enforced ?? false
    const zoneColor = isInside ? "#1D9E75" : "#EF9F27"

    root.add(new TextRenderable(renderer, {
      id: `tb-zone-${zone.category.slice(0, 6)}`,
      content: ` ${isInside ? "■" : "□"} ${zone.category}`,
      fg: zoneColor,
      attributes: 1,
    }))

    zone.items.forEach((item, i) => {
      const badge = item.enforced ? "ENFORCED" : "MONITORED"
      const badgeFg = item.enforced ? "#085041" : "#EF9F27"
      const nameW = 22
      const descW = Math.max(10, width - nameW - 14 - 10)
      const nameTrunc = item.name.length > nameW ? item.name.slice(0, nameW - 1) + "…" : item.name
      const descTrunc = item.description.length > descW ? item.description.slice(0, descW - 1) + "…" : item.description

      root.add(new TextRenderable(renderer, {
        id: `tb-item-${i}-${item.name.slice(0, 4)}`,
        content: `   ${nameTrunc.padEnd(nameW)} ${badge.padEnd(10)} ${descTrunc}`,
        fg: badgeFg,
      }))
    })

    root.add(new TextRenderable(renderer, {
      id: `tb-sep-${zone.category.slice(0, 4)}`,
      content: " " + "─".repeat(width - 4),
      fg: "#333333",
    }))
  }

  root.add(new TextRenderable(renderer, {
    id: "tb-philosophy",
    content: " Accepting this distinction is the architectural decision.",
    fg: "#666666",
  }))
  root.add(new TextRenderable(renderer, {
    id: "tb-philosophy2",
    content: " Making it visible is the product.",
    fg: "#666666",
  }))

  root.add(new TextRenderable(renderer, {
    id: "tb-footer",
    content: " w: world model   g: gate trace   Esc: back",
    fg: "#444444",
  }))

  return root
}
