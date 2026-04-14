import { BoxRenderable, TextRenderable, type CliRenderer } from "@opentui/core"

export type AnnotatedLine = {
  lineNo: number
  kind: "+" | "-" | " "
  content: string
  annotation: { gate: string; result: string; detail: string; latency: string } | null
}

export function generateCodeLines(): AnnotatedLine[] {
  return [
    { lineNo: 40, kind: " ", content: "import { Router } from 'express';", annotation: null },
    { lineNo: 41, kind: " ", content: "import jwt from 'jsonwebtoken';", annotation: null },
    { lineNo: 42, kind: "-", content: "const SECRET = process.env.JWT_SECRET;", annotation: null },
    { lineNo: 43, kind: "+", content: "const SECRET = config.get('jwt.secret');", annotation: { gate: "dep_graph", result: "PASS", detail: "dep: config -> jwt.secret", latency: "3ms" } },
    { lineNo: 44, kind: "+", content: "const EXPIRY = config.get('jwt.expiry') || '1h';", annotation: { gate: "assert_gate", result: "PASS", detail: "assert: EXPIRY is duration", latency: "1ms" } },
    { lineNo: 45, kind: " ", content: "", annotation: null },
    { lineNo: 46, kind: "-", content: "export function authenticate(req, res, next) {", annotation: null },
    { lineNo: 47, kind: "+", content: "export function authenticate(req: Request, res: Response, next: Next) {", annotation: { gate: "type_check", result: "PASS", detail: "types: Express middleware sig", latency: "4ms" } },
    { lineNo: 48, kind: " ", content: "  const token = req.headers.authorization?.split(' ')[1];", annotation: null },
    { lineNo: 49, kind: "-", content: "  const decoded = jwt.verify(token, SECRET);", annotation: null },
    { lineNo: 50, kind: "+", content: "  const decoded = jwt.verify(token, SECRET, { expiresIn: EXPIRY });", annotation: { gate: "contract", result: "FAIL", detail: "constraint: jwt.exp > now()", latency: "142ms" } },
    { lineNo: 51, kind: "+", content: "  if (decoded.exp < Date.now() / 1000) {", annotation: { gate: "io_boundary", result: "PASS", detail: "boundary: time comparison safe", latency: "2ms" } },
    { lineNo: 52, kind: "+", content: "    throw new TokenExpiredError(decoded.exp);", annotation: { gate: "type_check", result: "PASS", detail: "types: Error subclass", latency: "3ms" } },
    { lineNo: 53, kind: " ", content: "  }", annotation: null },
    { lineNo: 54, kind: " ", content: "  req.user = decoded;", annotation: null },
    { lineNo: 55, kind: "-", content: "  next();", annotation: null },
    { lineNo: 56, kind: "+", content: "  next();", annotation: { gate: "dep_graph", result: "PASS", detail: "flow: auth -> next handler", latency: "5ms" } },
    { lineNo: 57, kind: " ", content: "}", annotation: null },
  ]
}

export function buildCodeView(
  renderer: CliRenderer,
  lines: AnnotatedLine[],
  cursor: number,
  width: number,
  height: number,
): BoxRenderable {
  const root = new BoxRenderable(renderer, {
    id: "cv-root",
    flexDirection: "column",
    width: "auto",
    height: "auto",
    flexGrow: 1,
    padding: 1,
  })

  const addCount = lines.filter(l => l.kind === "+").length
  const delCount = lines.filter(l => l.kind === "-").length
  root.add(new TextRenderable(renderer, {
    id: "cv-header",
    content: ` CODE   src/auth.ts   +${addCount} −${delCount}`,
    fg: "#4A9FD8",
    attributes: 1,
  }))
  root.add(new TextRenderable(renderer, {
    id: "cv-sep1",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  const annW = 36
  const codeW = Math.max(10, width - 7 - annW - 6)

  root.add(new TextRenderable(renderer, {
    id: "cv-colhead",
    content: ` ${"    #".padEnd(6)}  ${"EDIT".padEnd(codeW)}  ${"SYMBOLIC GATE".padEnd(annW)}`,
    fg: "#555555",
  }))
  root.add(new TextRenderable(renderer, {
    id: "cv-sep2",
    content: " " + "─".repeat(width - 4),
    fg: "#333333",
  }))

  const maxLines = height - 9
  const start = Math.max(0, cursor - Math.floor(maxLines / 2))

  for (let i = start; i < Math.min(lines.length, start + maxLines); i++) {
    const line = lines[i]
    const isActive = i === cursor
    const codeRaw = `${line.kind} ${line.content}`
    const codeTrunc = codeRaw.length > codeW ? codeRaw.slice(0, codeW - 1) + "…" : codeRaw
    const codeFg = line.kind === "+" ? "#1D9E75" : line.kind === "-" ? "#E24B4A" : "#666666"

    let annStr = ""
    let annFg = "#444444"
    if (line.annotation) {
      const a = line.annotation
      const badge = `${a.gate}:${a.result}`
      annStr = `${badge.padEnd(14)} ${a.detail.slice(0, annW - 16)}`
      annFg = a.result === "PASS" ? "#085041" : "#EF9F27"
    } else {
      annStr = " ".repeat(annW)
    }

    const lineNum = String(line.lineNo).padStart(4)
    const marker = isActive ? ">" : " "

    root.add(new TextRenderable(renderer, {
      id: `cv-line-${i}`,
      content: `${marker} ${lineNum}  ${codeTrunc.padEnd(codeW)}  ${annStr}`,
      fg: isActive ? "#ffffff" : codeFg,
    }))
  }

  if (cursor < lines.length && lines[cursor].annotation) {
    const ann = lines[cursor].annotation!
    root.add(new TextRenderable(renderer, {
      id: "cv-detail-sep",
      content: " " + "─".repeat(width - 4),
      fg: "#333333",
    }))
    root.add(new TextRenderable(renderer, {
      id: "cv-detail",
      content: `   ${ann.gate}  ${ann.result === "PASS" ? "● PASS" : "✖ FAIL"}  ${ann.detail}  latency ${ann.latency}`,
      fg: ann.result === "PASS" ? "#1D9E75" : "#EF9F27",
    }))
  }

  root.add(new TextRenderable(renderer, {
    id: "cv-footer",
    content: " ↑↓: navigate   Enter: inspect   g: gate trace   Esc: back",
    fg: "#444444",
  }))

  return root
}
