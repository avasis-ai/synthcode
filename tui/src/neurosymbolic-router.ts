import * as fs from "fs"
import * as path from "path"
import { runShell, readFile, writeFile, listFiles } from "./tool-executor.js"

const CACHE_DIR = path.join(process.env.HOME || "/tmp", ".synthcode", "cache")
const PATTERN_FILE = path.join(CACHE_DIR, "tool-patterns.json")
const RESULT_FILE = path.join(CACHE_DIR, "tool-results.json")

export interface ToolPattern {
  intent: string
  tool: string
  args: string
  success: boolean
  timestamp: number
  hitCount: number
  modelUsed: string
}

export interface CachedResult {
  tool: string
  args: string
  output: string
  success: boolean
  timestamp: number
}

const SYMBOLIC_RULES: { check: (tool: string, args: string) => string | null; fix: (tool: string, args: string) => { tool: string; args: string } | null }[] = [
  {
    check: (_tool, args) => {
      const dangerRe = /rm\s+-rf\s+\//i
      if (dangerRe.test(args)) return "destructive: rm -rf on absolute path"
      return null
    },
    fix: null,
  },
  {
    check: (_tool, args) => {
      const pathTraversal = /\.\.[\/\\]\.\./.test(args)
      if (pathTraversal) return "security: path traversal detected"
      return null
    },
    fix: null,
  },
  {
    check: (tool, args) => {
      if (tool === "write") {
        try {
          const parsed = JSON.parse(args)
          if (parsed.content && /password\s*=\s*['"][^'"]+['"]/i.test(parsed.content)) return "security: hardcoded password in write"
        } catch {}
      }
      return null
    },
    fix: null,
  },
  {
    check: (tool, args) => {
      if (tool === "run" && /^mkdir\s+/.test(args) && !/-p\s/.test(args)) return "robustness: mkdir without -p flag"
      return null
    },
    fix: (tool, args) => ({ tool, args: args.replace(/^mkdir\s+/, "mkdir -p ") }),
  },
  {
    check: (tool, args) => {
      if (tool === "run" && /^cd\s+/.test(args)) return "robustness: cd is stateless in exec, use && instead"
      return null
    },
    fix: (tool, args) => ({ tool, args: args.replace(/^cd\s+(\S+)\s*/, "") || `echo 'cd removed: use absolute paths'` }),
  },
  {
    check: (tool, args) => {
      if (tool === "run" && /^npm\s+install\s/.test(args) && !/--save/.test(args) && !/-[gD]/.test(args)) return "robustness: npm install may need flags"
      return null
    },
    fix: null,
  },
  {
    check: (tool, args) => {
      if (tool === "run" && /^git\s+push/.test(args) && !/--force/.test(args)) return null
      if (tool === "run" && /--force/.test(args)) return "safety: --force flag detected"
      return null
    },
    fix: null,
  },
  {
    check: (tool, args) => {
      if (tool === "run" && /^open\s+/.test(args)) {
        if (!args.includes("http") && !fs.existsSync(args.replace(/^open\s+/, "").trim())) return "robustness: file to open does not exist yet"
      }
      return null
    },
    fix: null,
  },
]

const INTENT_MAP: { patterns: RegExp[]; tool: string; argsTemplate: (match: RegExpMatchArray) => string }[] = [
  {
    patterns: [/list\s+(?:files?\s+)?in\s+(\S+)/i, /show\s+(?:me\s+)?(?:the\s+)?files?\s+(?:in\s+)?(\S+)/i, /what'?s?\s+in\s+(\S+)/i, /ls\s+(\S+)/i],
    tool: "run",
    argsTemplate: (m) => `ls -la ${m[1]}`,
  },
  {
    patterns: [/read\s+(?:the\s+)?file\s+(\S+)/i, /show\s+(?:me\s+)?(?:the\s+)?(?:contents?\s+)?(?:of\s+)?(\S+)/i, /cat\s+(\S+)/i],
    tool: "read",
    argsTemplate: (m) => m[1],
  },
  {
    patterns: [/create\s+(?:a\s+)?(?:new\s+)?file\s+(\S+)/i, /make\s+(?:a\s+)?file\s+(?:at\s+)?(\S+)/i],
    tool: "write",
    argsTemplate: (m) => JSON.stringify({ path: m[1], content: "" }),
  },
  {
    patterns: [/delete\s+(?:the\s+)?file\s+(\S+)/i, /remove\s+(\S+)/i, /rm\s+(\S+)/i],
    tool: "run",
    argsTemplate: (m) => `rm ${m[1]}`,
  },
  {
    patterns: [/install\s+(\S+)/i, /npm\s+install\s+(\S+)/i, /pip\s+install\s+(\S+)/i, /brew\s+install\s+(\S+)/i],
    tool: "run",
    argsTemplate: (m) => `npm install ${m[1]}`,
  },
  {
    patterns: [/run\s+(.+)/i, /execute\s+(.+)/i],
    tool: "run",
    argsTemplate: (m) => m[1].trim(),
  },
]

let patternCache: ToolPattern[] = []
let resultCache: CachedResult[] = []

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function loadPatterns(): ToolPattern[] {
  if (patternCache.length > 0) return patternCache
  try {
    ensureCacheDir()
    if (fs.existsSync(PATTERN_FILE)) {
      patternCache = JSON.parse(fs.readFileSync(PATTERN_FILE, "utf-8"))
    }
  } catch {}
  return patternCache
}

function savePatterns() {
  try {
    ensureCacheDir()
    fs.writeFileSync(PATTERN_FILE, JSON.stringify(patternCache.slice(-500), null, 2))
  } catch {}
}

function loadResults(): CachedResult[] {
  if (resultCache.length > 0) return resultCache
  try {
    ensureCacheDir()
    if (fs.existsSync(RESULT_FILE)) {
      resultCache = JSON.parse(fs.readFileSync(RESULT_FILE, "utf-8"))
    }
  } catch {}
  return resultCache
}

function saveResults() {
  try {
    ensureCacheDir()
    fs.writeFileSync(RESULT_FILE, JSON.stringify(resultCache.slice(-200), null, 2))
  } catch {}
}

export function learn(intent: string, tool: string, args: string, success: boolean, modelUsed: string) {
  const patterns = loadPatterns()
  const existing = patterns.find(p => p.intent === intent && p.tool === tool && p.args === args)
  if (existing) {
    existing.hitCount++
    existing.success = success
    existing.timestamp = Date.now()
  } else {
    patterns.push({ intent, tool, args, success, timestamp: Date.now(), hitCount: 1, modelUsed })
  }
  savePatterns()
}

export function cacheResult(tool: string, args: string, output: string, success: boolean) {
  const results = loadResults()
  const existing = results.find(r => r.tool === tool && r.args === args)
  if (existing) {
    existing.output = output
    existing.success = success
    existing.timestamp = Date.now()
  } else {
    results.push({ tool, args, output, success, timestamp: Date.now() })
  }
  saveResults()
}

export function lookupResult(tool: string, args: string): CachedResult | null {
  const results = loadResults()
  const now = Date.now()
  const fresh = results.filter(r => r.tool === tool && r.args === args && (now - r.timestamp) < 300000)
  return fresh.length > 0 ? fresh[fresh.length - 1] : null
}

export type CorrectionResult = {
  blocked: boolean
  reason: string | null
  correctedTool: string
  correctedArgs: string
  corrections: string[]
}

export function symbolicallyCorrect(tool: string, args: string): CorrectionResult {
  const corrections: string[] = []
  let currentTool = tool
  let currentArgs = args
  let blocked = false
  let blockReason: string | null = null

  for (const rule of SYMBOLIC_RULES) {
    const issue = rule.check(currentTool, currentArgs)
    if (issue) {
      if (rule.fix) {
        const fixed = rule.fix(currentTool, currentArgs)
        if (fixed) {
          currentTool = fixed.tool
          currentArgs = fixed.args
          corrections.push(`fixed: ${issue}`)
        }
      } else {
        blocked = true
        blockReason = issue
        corrections.push(`blocked: ${issue}`)
      }
    }
  }

  return { blocked, reason: blockReason, correctedTool: currentTool, correctedArgs: currentArgs, corrections }
}

export function resolveFromCache(intent: string): { tool: string; args: string } | null {
  const patterns = loadPatterns()
  const lowerIntent = intent.toLowerCase()

  const matches = patterns
    .filter(p => p.success && (lowerIntent.includes(p.intent.toLowerCase()) || p.intent.toLowerCase().includes(lowerIntent.split(" ")[0])))
    .sort((a, b) => b.hitCount - a.hitCount)

  if (matches.length > 0) {
    const best = matches[0]
    best.hitCount++
    savePatterns()
    return { tool: best.tool, args: best.args }
  }

  for (const mapping of INTENT_MAP) {
    for (const pat of mapping.patterns) {
      const m = intent.match(pat)
      if (m) {
        return { tool: mapping.tool, args: mapping.argsTemplate(m) }
      }
    }
  }

  return null
}

export type RouteDecision = {
  source: "cache" | "model" | "intent"
  tool: string
  args: string
  correction?: CorrectionResult
  cacheHit?: CachedResult
}

export function routeToolCall(tool: string, args: string, userIntent: string): RouteDecision {
  const correction = symbolicallyCorrect(tool, args)
  if (correction.blocked) {
    return { source: "model", tool, args, correction }
  }

  const cached = lookupResult(correction.correctedTool, correction.correctedArgs)
  if (cached) {
    return { source: "cache", tool: cached.tool, args: cached.args, correction: correction.corrections.length > 0 ? correction : undefined, cacheHit: cached }
  }

  return { source: "model", tool: correction.correctedTool, args: correction.correctedArgs, correction: correction.corrections.length > 0 ? correction : undefined }
}

export function getCacheStats(): { patterns: number; results: number; topIntents: string[] } {
  const patterns = loadPatterns()
  const results = loadResults()
  const topIntents = patterns
    .filter(p => p.success)
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 5)
    .map(p => `${p.intent} -> ${p.tool} (${p.hitCount}x)`)
  return { patterns: patterns.length, results: results.length, topIntents }
}

export function enrichSystemPrompt(basePrompt: string): string {
  const patterns = loadPatterns()
  const learned = patterns
    .filter(p => p.success && p.hitCount >= 2)
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 20)

  if (learned.length === 0) return basePrompt

  const learnedSection = learned.map(p => `- "${p.intent}" -> ${p.tool} ${p.args} (used ${p.hitCount}x, ${p.modelUsed})`).join("\n")
  return `${basePrompt}

LEARNED PATTERNS (from your previous successful actions on this machine):
${learnedSection}

Prefer these proven patterns when the user's request matches.`
}
