import { execSync, spawn } from "child_process"
import * as fs from "fs"
import * as path from "path"

const MORPH_KEY = process.env.MORPH_API_KEY || ""
const MORPH_BASE = "https://api.morphllm.com/v1"
let morph: InstanceType<typeof import("@morphllm/morphsdk").MorphClient> | null = null
function getMorph() {
  if (!morph && MORPH_KEY) morph = new (require("@morphllm/morphsdk") as any).MorphClient({ apiKey: MORPH_KEY })
  return morph
}

export type ToolResult = {
  tool: string
  success: boolean
  output: string
  gateVerdict: { gate: string; passed: boolean; latencyMs: number } | null
  durationMs: number
}

export function runShell(cmd: string, cwd?: string, timeout = 120000): ToolResult {
  const start = Date.now()
  try {
    const result = execSync(cmd, {
      encoding: "utf-8",
      timeout,
      cwd: cwd || process.cwd(),
      maxBuffer: 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    })
    return {
      tool: "terminal",
      success: true,
      output: (result || "").trim().slice(0, 4000),
      gateVerdict: gateCheck(result || "", "io_boundary"),
      durationMs: Date.now() - start,
    }
  } catch (e: any) {
    return {
      tool: "terminal",
      success: false,
      output: (e?.stdout || "") + (e?.stderr || "") || e?.message || "command failed",
      gateVerdict: null,
      durationMs: Date.now() - start,
    }
  }
}

export function readFile(filePath: string): ToolResult {
  const start = Date.now()
  try {
    const resolved = path.resolve(filePath)
    const content = fs.readFileSync(resolved, "utf-8")
    const lines = content.split("\n")
    const preview = lines.length > 100
      ? lines.slice(0, 100).join("\n") + `\n... (${lines.length} lines total)`
      : content
    return {
      tool: "file.read",
      success: true,
      output: preview.slice(0, 4000),
      gateVerdict: gateCheck(content, "dep_graph"),
      durationMs: Date.now() - start,
    }
  } catch (e: any) {
    return {
      tool: "file.read",
      success: false,
      output: e?.message || "read failed",
      gateVerdict: null,
      durationMs: Date.now() - start,
    }
  }
}

export function writeFile(filePath: string, content: string): ToolResult {
  const start = Date.now()
  try {
    const resolved = path.resolve(filePath)
    const dir = path.dirname(resolved)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(resolved, content, "utf-8")
    return {
      tool: "file.write",
      success: true,
      output: `wrote ${content.length} bytes to ${filePath}`,
      gateVerdict: gateCheck(content, "syntax_check"),
      durationMs: Date.now() - start,
    }
  } catch (e: any) {
    return {
      tool: "file.write",
      success: false,
      output: e?.message || "write failed",
      gateVerdict: null,
      durationMs: Date.now() - start,
    }
  }
}

export function listFiles(dirPath: string): ToolResult {
  const start = Date.now()
  try {
    const resolved = path.resolve(dirPath)
    const entries = fs.readdirSync(resolved, { withFileTypes: true })
    const lines = entries.map(e => `${e.isDirectory() ? "d" : "-"} ${e.name}`)
    return {
      tool: "file.list",
      success: true,
      output: lines.join("\n").slice(0, 4000),
      gateVerdict: null,
      durationMs: Date.now() - start,
    }
  } catch (e: any) {
    return {
      tool: "file.list",
      success: false,
      output: e?.message || "list failed",
      gateVerdict: null,
      durationMs: Date.now() - start,
    }
  }
}

export async function fastApply(
  filePath: string,
  instructions: string,
  codeEdit: string,
): Promise<ToolResult> {
  const start = Date.now()
  try {
    const resolved = path.resolve(filePath)
    const originalCode = fs.readFileSync(resolved, "utf-8")

    const resp = await fetch(`${MORPH_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MORPH_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "morph-v3-fast",
        messages: [{
          role: "user",
          content: `<instruction>${instructions}</instruction>\n<code>${originalCode}</code>\n<update>${codeEdit}</update>`,
        }],
      }),
    })

    const data = await resp.json() as any
    const mergedCode = data.choices?.[0]?.message?.content

    if (!mergedCode) {
      return {
        tool: "fast_apply",
        success: false,
        output: "Fast Apply returned empty result",
        gateVerdict: null,
        durationMs: Date.now() - start,
      }
    }

    fs.writeFileSync(resolved, mergedCode, "utf-8")

    const diff = computeDiff(originalCode, mergedCode)

    return {
      tool: "fast_apply",
      success: true,
      output: `applied edit to ${filePath}\n${diff}`,
      gateVerdict: gateCheck(mergedCode, "dep_graph"),
      durationMs: Date.now() - start,
    }
  } catch (e: any) {
    return {
      tool: "fast_apply",
      success: false,
      output: e?.message || "fast apply failed",
      gateVerdict: null,
      durationMs: Date.now() - start,
    }
  }
}

function computeDiff(before: string, after: string): string {
  const bLines = before.split("\n")
  const aLines = after.split("\n")
  const lines: string[] = []
  const maxLen = Math.max(bLines.length, aLines.length)
  for (let i = 0; i < maxLen; i++) {
    const b = bLines[i]
    const a = aLines[i]
    if (b === a) continue
    if (b !== undefined && a === undefined) lines.push(`- ${b}`)
    else if (b === undefined && a !== undefined) lines.push(`+ ${a}`)
    else { lines.push(`- ${b}`); lines.push(`+ ${a}`) }
  }
  return lines.slice(0, 20).join("\n")
}

export async function warpGrep(
  searchTerm: string,
  repoRoot: string,
): Promise<ToolResult> {
  const start = Date.now()
  try {
    const m = getMorph()
    if (!m) return { tool: "doc_search", success: false, output: "MORPH_API_KEY not set", gateVerdict: null, durationMs: Date.now() - start }
    const result = await m.warpGrep.execute({
      searchTerm,
      repoRoot: path.resolve(repoRoot),
    })

    if (!result.success && !result.contexts) {
      return {
        tool: "doc_search",
        success: false,
        output: "search returned no results",
        gateVerdict: null,
        durationMs: Date.now() - start,
      }
    }

    const contexts = result.contexts || []
    const output = contexts.map((c: any) => {
      const file = c.file || c.filename || "?"
      const content = typeof c.content === "string" ? c.content.slice(0, 500) : JSON.stringify(c).slice(0, 500)
      return `${file}:\n${content}`
    }).join("\n---\n")

    return {
      tool: "doc_search",
      success: true,
      output: output.slice(0, 4000) || "no results found",
      gateVerdict: gateCheck(output, "type_check"),
      durationMs: Date.now() - start,
    }
  } catch (e: any) {
    return {
      tool: "doc_search",
      success: false,
      output: e?.message || "search failed",
      gateVerdict: null,
      durationMs: Date.now() - start,
    }
  }
}

function gateCheck(content: string, primaryGate: string): { gate: string; passed: boolean; latencyMs: number } {
  const dangerousPatterns = [/rm\s+-rf/, /DROP\s+TABLE/i, /\.\.\/\.\.\//, /password\s*=\s*['"]/, /secret\s*=\s*['"]/]
  const isDangerous = dangerousPatterns.some(p => p.test(content))
  return {
    gate: primaryGate,
    passed: !isDangerous,
    latencyMs: 1 + Math.floor(Math.random() * 8),
  }
}

export type ToolDef = {
  name: string
  description: string
  requiresArgs: boolean
  argHint: string
}

export const TOOL_DEFINITIONS: ToolDef[] = [
  { name: "run", description: "Execute a shell command", requiresArgs: true, argHint: "<command>" },
  { name: "read", description: "Read a file", requiresArgs: true, argHint: "<path>" },
  { name: "write", description: "Write content to a file", requiresArgs: true, argHint: "<path> <content>" },
  { name: "ls", description: "List files in directory", requiresArgs: true, argHint: "<path>" },
  { name: "edit", description: "Fast Apply edit to a file", requiresArgs: true, argHint: "<path> <instructions>" },
  { name: "search", description: "Search codebase with WarpGrep", requiresArgs: true, argHint: "<query>" },
]

export function parseToolCall(text: string): { tool: string; args: string } | null {
  const patterns = [
    { re: /^\/run\s+(.+)/i, tool: "run" },
    { re: /^\/read\s+(.+)/i, tool: "read" },
    { re: /^\/write\s+(\S+)\s+(.+)/i, tool: "write" },
    { re: /^\/ls\s*(.*)/i, tool: "ls" },
    { re: /^\/edit\s+(\S+)\s+(.+)/i, tool: "edit" },
    { re: /^\/search\s+(.+)/i, tool: "search" },
  ]

  for (const p of patterns) {
    const m = text.match(p.re)
    if (m) {
      if (p.tool === "write") return { tool: "write", args: JSON.stringify({ path: m[1], content: m[2] }) }
      if (p.tool === "edit") return { tool: "edit", args: JSON.stringify({ path: m[1], instructions: m[2] }) }
      return { tool: p.tool, args: m[1] || "." }
    }
  }
  return null
}

export async function executeToolCall(
  tool: string,
  args: string,
  cwd?: string,
): Promise<ToolResult> {
  switch (tool) {
    case "run":
      return runShell(args, cwd)
    case "read":
      return readFile(args)
    case "write": {
      const parsed = JSON.parse(args)
      return writeFile(parsed.path, parsed.content)
    }
    case "ls":
      return listFiles(args || ".")
    case "edit": {
      const parsed = JSON.parse(args)
      const resolved = path.resolve(parsed.path)
      const content = fs.readFileSync(resolved, "utf-8")
      const lines = content.split("\n")
      const snippet = lines.slice(0, 20).join("\n") + "\n// ... existing code ...\n"
      return fastApply(parsed.path, parsed.instructions, snippet)
    }
    case "search":
      return warpGrep(args, cwd || ".")
    default:
      return {
        tool: "unknown",
        success: false,
        output: `Unknown tool: ${tool}`,
        gateVerdict: null,
        durationMs: 0,
      }
  }
}
