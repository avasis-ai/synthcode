import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core"
import { getSystemProfile, getModelRecommendations, getBestModel, installModel } from "./inspector.js"
import type { SystemProfile, ModelCandidate } from "./inspector.js"
import { buildGateTrace, generateGateDecisions, type GateDecision } from "./screens/gate-trace.js"
import { buildCodeView, generateCodeLines, type AnnotatedLine } from "./screens/code-view.js"
import { buildWorldModel, generateInvariants, type Invariant } from "./screens/world-model.js"
import { buildTrustBoundary } from "./screens/trust-boundary.js"
import { buildPlayground, computeModelResult, type ModelResult } from "./screens/playground.js"
import {
  verifyContent,
  type GateVerdict,
} from "./gate-verifier.js"
import {
  parseToolCall,
  executeToolCall,
  type ToolResult,
} from "./tool-executor.js"
import {
  routeToolCall,
  learn,
  cacheResult,
  enrichSystemPrompt,
  getCacheStats,
} from "./neurosymbolic-router.js"

type Screen = "splash" | "setup" | "cloud-setup" | "cloud-models" | "inspector" | "chat"
type Mode = "chat" | "gate" | "code" | "world" | "trust" | "playground"

const PROVIDERS: { id: string; name: string; base: string; models: string[] }[] = [
  { id: "gemini", name: "Google Gemini", base: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"] },
  { id: "groq", name: "Groq", base: "https://api.groq.com/openai/v1/chat/completions", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"] },
  { id: "openrouter", name: "OpenRouter", base: "https://openrouter.ai/api/v1/chat/completions", models: ["anthropic/claude-sonnet-4", "google/gemini-2.5-flash", "meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-chat"] },
  { id: "openai", name: "OpenAI", base: "https://api.openai.com/v1/chat/completions", models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o"] },
]

const OLLAMA_URL = "http://localhost:11434/v1/chat/completions"
let apiBase = PROVIDERS[0].base
let apiKey = process.env.SYNTHCODE_API_KEY || ""

function getApiConfig(): { url: string; key: string } {
  if (modelSource === "local") return { url: OLLAMA_URL, key: "ollama" }
  return { url: apiBase, key: apiKey }
}

const SYSTEM_PROMPT = `You are SynthCode, an autonomous neurosymbolic coding agent with FULL control of the user's machine. You have complete terminal access.

AVAILABLE TOOLS (use these as exact prefixes on their own line):
/run <command>         Execute any shell command
/read <filepath>       Read any file
/write <filepath> <content>  Create or overwrite a file (content on following lines)
/ls <path>             List directory
/edit <filepath> <description>  Apply a surgical code edit
/search <query>        Search the codebase

RULES:
1. BUILD things autonomously — create files, install deps, verify it works.
2. Use MULTIPLE tool calls per response. Chain them. Don't wait.
3. After creating code, /run install/build/test to verify.
4. If something fails, read the error, fix it, retry.
5. Use absolute paths for new projects.

Example:
/run mkdir -p ~/snake-game
/write ~/snake-game/index.html
<!DOCTYPE html><html>...game...</html>
/run open ~/snake-game/index.html`

const MAX_AGENT_ROUNDS = 15

interface Message {
  role: "user" | "assistant" | "tool"
  content: string
  gateVerdicts: GateVerdict[]
  toolResult?: ToolResult
}

let renderer: CliRenderer
let termWidth = 80
let termHeight = 24
let currentScreen: Screen = "splash"
let messages: Message[] = []
let model = "gemini-2.5-flash"
let modelSource: "local" | "cloud" = "cloud"
let inputText = ""
let isThinking = false
let selectedSetupOption = 0
let activeMode: Mode = "chat"

let commandPalette = false
let commandFilter = ""
let commandList: { cmd: string; desc: string }[] = []
let commandIndex = 0

let scrollOffset = 0

let gateDecisions: GateDecision[] = []
let gateFilter = ""
let codeLines: AnnotatedLine[] = []
let codeCursor = 0
let worldInvariants: Invariant[] = []
let worldTotalBytes = 0

let profile: SystemProfile | null = null
let inspectorModels: ModelCandidate[] = []
let inspectorBest: ModelCandidate | null = null
let inspectorIndex = 0
let inspectorPhase = 0
let inspectorDone = false
let inspectorInstalling = false
let inspectorInstallName = ""

let playgroundResults: ModelResult[] = []
let playgroundRunning = false

let gateLiveIdx = -1
let gateAnimating = false

let cloudProviderIdx = 0
let cloudKeyInput = ""
let cloudModelIdx = 0

let modelPicker = false
let modelPickerIdx = 0

function clearScreen() {
  const children = renderer.root.getChildren()
  children.forEach(c => renderer.root.remove(c.id))
}

function buildSplash() {
  clearScreen()
  currentScreen = "splash"

  const logoLines = [
    "$$$$$$$\\                       $$\\     $$\\        $$$$$$\\                  $$\\           ",
    "$$  __$$\\                      $$ |    $$ |      $$  __$$\\                 $$ |          ",
    "$$ /  \\__|$$\\   $$\\ $$$$$$$\\ $$$$$$\\   $$$$$$$\\  $$ /  \\__| $$$$$$\\   $$$$$$$ | $$$$$$\\  ",
    "\\$$$$$$\\  $$ |  $$ |$$  __$$\\\\_$$  _|  $$  __$$\\ $$ |      $$  __$$\\ $$  __$$ |$$  __$$\\ ",
    " \\____$$\\ $$ |  $$ |$$ |  $$ | $$ |    $$ |  $$ |$$ |      $$ /  $$ |$$ /  $$ |$$$$$$$$ |",
    "$$\\   $$ |$$ |  $$ |$$ |  $$ | $$ |$$\\ $$ |  $$ |$$ |  $$\\ $$ |  $$ |$$ |  $$ |$$   ____|",
    "\\$$$$$$  |\\$$$$$$$ |$$ |  $$ | \\$$$$  |$$ |  $$ |\\$$$$$$  |\\$$$$$$  |\\$$$$$$$ |\\$$$$$$$\\ ",
    " \\______/  \\____$$ |\\__|  \\__|  \\____/ \\__|  \\__| \\______/  \\______/  \\_______| \\_______|",
    "          $$\\   $$ |                                                                     ",
    "          \\$$$$$$  |                                                                     ",
    "           \\______/                                                                      ",
  ]

  const container = new BoxRenderable(renderer, {
    id: "splash", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1,
    justifyContent: "center", alignItems: "center",
  })

  logoLines.forEach((line, i) => {
    container.add(new TextRenderable(renderer, { id: `logo-${i}`, content: line, fg: "#7c5cfc" }))
  })
  container.add(new BoxRenderable(renderer, { id: "sp1", height: 1 }))
  container.add(new TextRenderable(renderer, { id: "tagline", content: "Neural Intuition x Symbolic Precision", fg: "#9b7dff" }))
  container.add(new BoxRenderable(renderer, { id: "sp2", height: 1 }))
  container.add(new TextRenderable(renderer, { id: "hint", content: "Press any key to continue", fg: "#666666" }))
  renderer.root.add(container)
}

function buildSetup() {
  clearScreen()
  currentScreen = "setup"
  const c = new BoxRenderable(renderer, {
    id: "setup", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1,
    justifyContent: "center", alignItems: "center", gap: 1,
  })
  c.add(new TextRenderable(renderer, { id: "st", content: "Model Setup", fg: "white", attributes: 1 }))
  c.add(new BoxRenderable(renderer, { id: "s1", height: 1 }))
  c.add(new TextRenderable(renderer, { id: "sd", content: "Choose how to connect to a model for inference", fg: "#888888" }))
  c.add(new BoxRenderable(renderer, { id: "s2", height: 1 }))
  const opts = [
    { key: "1", label: "LOCAL MODEL", desc: "Deep system inspection, Ollama SLM" },
    { key: "2", label: "CLOUD MODEL", desc: "Gemini / Groq / OpenRouter / OpenAI" },
  ]
  opts.forEach((o, i) => {
    c.add(new TextRenderable(renderer, {
      id: `opt-${i}`,
      content: `${i === selectedSetupOption ? ">" : " "} [${o.key}] ${o.label}  - ${o.desc}`,
      fg: i === selectedSetupOption ? "#00e5a0" : "#888888",
    }))
  })
  c.add(new BoxRenderable(renderer, { id: "s3", height: 1 }))
  c.add(new TextRenderable(renderer, { id: "sn", content: "Up/Down: navigate  Enter: select", fg: "#555555" }))
  renderer.root.add(c)
}

function buildCloudSetup() {
  clearScreen()
  currentScreen = "cloud-setup"
  const c = new BoxRenderable(renderer, {
    id: "cs", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1,
    padding: 4, gap: 0,
  })
  c.add(new TextRenderable(renderer, { id: "cs-t", content: "  Cloud Provider Setup", fg: "white", attributes: 1 }))
  c.add(new TextRenderable(renderer, { id: "cs-1", content: "  Select a provider and enter your API key", fg: "#666666" }))
  c.add(new TextRenderable(renderer, { id: "cs-sep1", content: "  " + "\u2500".repeat(40), fg: "#333333" }))
  PROVIDERS.forEach((p, i) => {
    const selected = i === cloudProviderIdx
    const marker = selected ? " > " : "   "
    const check = selected ? " [OK]" : ""
    c.add(new TextRenderable(renderer, {
      id: `cs-p-${i}`,
      content: `${marker}${p.name.padEnd(18)} ${p.models[0]}${check}`,
      fg: selected ? "#00e5a0" : "#888888",
      attributes: selected ? 1 : 0,
    }))
  })
  c.add(new TextRenderable(renderer, { id: "cs-sep2", content: "  " + "\u2500".repeat(40), fg: "#333333" }))
  c.add(new TextRenderable(renderer, { id: "cs-kl", content: "  API Key:", fg: "#888888" }))
  const maskedKey = cloudKeyInput.length > 8
    ? cloudKeyInput.slice(0, 4) + "..." + cloudKeyInput.slice(-4)
    : cloudKeyInput.length > 0 ? cloudKeyInput : "(paste or type your key)"
  c.add(new TextRenderable(renderer, { id: "cs-kv", content: `  ${maskedKey}`, fg: cloudKeyInput ? "#00cc66" : "#444444" }))

  const canContinue = cloudKeyInput.length > 0
  c.add(new TextRenderable(renderer, { id: "cs-sep3", content: "  " + "\u2500".repeat(40), fg: "#333333" }))
  if (canContinue) {
    c.add(new TextRenderable(renderer, { id: "cs-go", content: "  Enter: continue to model selection", fg: "#00e5a0" }))
  } else {
    c.add(new TextRenderable(renderer, { id: "cs-go", content: "  Type or paste your API key, then press Enter", fg: "#cc6600" }))
  }
  c.add(new TextRenderable(renderer, { id: "cs-n", content: "  Up/Down: provider  Esc: back", fg: "#444444" }))
  renderer.root.add(c)
}

function buildCloudModels() {
  clearScreen()
  currentScreen = "cloud-models"
  const provider = PROVIDERS[cloudProviderIdx]
  const c = new BoxRenderable(renderer, {
    id: "cm", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1,
    padding: 4, gap: 0,
  })
  c.add(new TextRenderable(renderer, { id: "cm-t", content: `  Select Model - ${provider.name}`, fg: "white", attributes: 1 }))
  c.add(new TextRenderable(renderer, { id: "cm-d", content: `  Provider: ${provider.name}  Key: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`, fg: "#666666" }))
  c.add(new TextRenderable(renderer, { id: "cm-sep1", content: "  " + "\u2500".repeat(40), fg: "#333333" }))
  provider.models.forEach((m, i) => {
    const selected = i === cloudModelIdx
    c.add(new TextRenderable(renderer, {
      id: `cm-m-${i}`,
      content: `  ${selected ? ">" : " "} ${m}`,
      fg: selected ? "#00e5a0" : "#888888",
      attributes: selected ? 1 : 0,
    }))
  })
  c.add(new TextRenderable(renderer, { id: "cm-sep2", content: "  " + "\u2500".repeat(40), fg: "#333333" }))
  c.add(new TextRenderable(renderer, { id: "cm-go", content: `  Enter: start with ${provider.models[cloudModelIdx]}`, fg: "#00e5a0" }))
  c.add(new TextRenderable(renderer, { id: "cm-n", content: "  Up/Down: select  Esc: back", fg: "#444444" }))
  renderer.root.add(c)
}

async function buildInspector() {
  clearScreen()
  currentScreen = "inspector"
  if (inspectorPhase === 0 && !inspectorDone) {
    inspectorDone = false
    inspectorInstalling = false
  }
  const root = new BoxRenderable(renderer, {
    id: "insp-root", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1, padding: 1,
  })
  root.add(new TextRenderable(renderer, { id: "insp-t", content: " SYSTEM INSPECTOR", fg: "#00cccc", attributes: 1 }))
  root.add(new TextRenderable(renderer, { id: "insp-s", content: " Deep neurosymbolic hardware profiling", fg: "#888888" }))
  const labels = ["Probing CPU topology...", "Mapping memory architecture...", "Detecting GPU compute units...", "Reading storage subsystem...", "Checking inference runtimes..."]
  labels.forEach((l, i) => {
    const pfx = i < inspectorPhase ? "[OK] " : i === inspectorPhase ? " [..] " : "     "
    const fg = i < inspectorPhase ? "#00cc66" : i === inspectorPhase ? "#cccc00" : "#555555"
    root.add(new TextRenderable(renderer, { id: `sc-${i}`, content: `   ${pfx}${l}`, fg }))
  })
  if (inspectorPhase >= 5 && profile) {
    root.add(new TextRenderable(renderer, { id: "hw-sep", content: "", fg: "#333355" }))
    const hw = new BoxRenderable(renderer, {
      id: "hw-box", flexDirection: "column", border: true, borderColor: "#333355",
      borderStyle: "single", padding: 1, width: "auto",
    })
    hw.add(new TextRenderable(renderer, { id: "hw-t", content: "HARDWARE PROFILE", fg: "#00cccc", attributes: 1 }))
    hw.add(new TextRenderable(renderer, { id: "hw-1", content: `CPU:    ${profile.cpu.model} (${profile.cpu.cores} cores)`, fg: "#cccccc" }))
    hw.add(new TextRenderable(renderer, { id: "hw-3", content: `Memory: ${profile.memory.availableGB.toFixed(1)} GB free / ${profile.memory.totalGB.toFixed(1)} GB total`, fg: "#00cc66" }))
    hw.add(new TextRenderable(renderer, { id: "hw-4", content: `GPU:    ${profile.gpu.model} (${profile.gpu.cores} cores)`, fg: "#cccccc" }))
    hw.add(new TextRenderable(renderer, { id: "hw-6", content: `Ollama: ${profile.ollama.installed ? `Installed (${profile.ollama.models.length} models)` : "Not Found"}`, fg: profile.ollama.installed ? "#00cc66" : "#cc3333" }))
    root.add(hw)
    const sc = profile.neuralScore > 70 ? "#00cc66" : profile.neuralScore > 40 ? "#cccc00" : "#cc3333"
    root.add(new TextRenderable(renderer, { id: "score-l", content: ` NEURAL SCORE: ${profile.neuralScore}/100`, fg: sc, attributes: 1 }))
    root.add(new TextRenderable(renderer, { id: "score-b", content: ` ${"#".repeat(Math.round(profile.neuralScore / 100 * 30))}${"-".repeat(30 - Math.round(profile.neuralScore / 100 * 30))}`, fg: sc }))
  }
  if (inspectorPhase >= 6 && inspectorModels.length > 0 && inspectorBest) {
    root.add(new TextRenderable(renderer, { id: "mod-sep", content: "", fg: "#333355" }))
    root.add(new TextRenderable(renderer, { id: "mod-t", content: " MODEL COMPATIBILITY", fg: "#00cccc", attributes: 1 }))
    const inst = profile?.ollama.models ?? []
    const allRows: { m: ModelCandidate; installed: boolean }[] = [
      ...inspectorModels.map(m => ({ m, installed: inst.some(n => n.split(":")[0] === m.ollamaName.split(":")[0]) })),
    ]
    inst.filter(n => !inspectorModels.some(m => m.ollamaName.split(":")[0] === n.split(":")[0])).forEach(name => {
      allRows.push({ m: { name, ollamaName: name, params: "?", sizeGB: 0, minRamGB: 0, specialty: "Detected", tier: "slm" as const, fitsOnMachine: true, hardcoreMode: true, ollamaCommand: "" }, installed: true })
    })
    const selectable = allRows.filter(r => r.m.fitsOnMachine || r.m.hardcoreMode || r.installed)
    inspectorIndex = Math.min(inspectorIndex, Math.max(0, selectable.length - 1))
    allRows.forEach((row, i) => {
      const m = row.m
      const selIdx = selectable.indexOf(row)
      const active = selIdx === inspectorIndex
      const isBest = inspectorBest && m.ollamaName === inspectorBest.ollamaName
      const sz = m.sizeGB > 0 ? `${m.sizeGB.toFixed(1)}GB` : "?"
      const st = row.installed ? "INSTALLED" : isBest ? "RECOMMENDED" : m.fitsOnMachine ? "OK" : "Large"
      root.add(new TextRenderable(renderer, {
        id: `model-${i}`,
        content: ` ${active ? ">" : " "} ${isBest ? "*" : " "} ${m.name.padEnd(22)} ${sz.padEnd(6)} ${st}`,
        fg: active ? "#ffffff" : row.installed ? "#00cc66" : "#888888",
      }))
    })
    if (!inspectorInstalling && !inspectorDone) {
      root.add(new TextRenderable(renderer, { id: "insp-nav", content: " Up/Down: select | Enter: install/use | Esc: skip", fg: "#555555" }))
    } else if (inspectorInstalling) {
      root.add(new TextRenderable(renderer, { id: "insp-inst", content: ` Installing ${inspectorInstallName}...`, fg: "#cccc00" }))
    }
  }
  renderer.root.add(root)
  if (inspectorPhase === 0) runInspection().catch(console.error)
}

async function runInspection() {
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, [300, 500, 400, 600, 500][i]))
    inspectorPhase = i + 1
    buildInspector()
  }
  profile = await getSystemProfile()
  inspectorPhase = 5
  buildInspector()
  await new Promise(r => setTimeout(r, 500))
  inspectorModels = getModelRecommendations(profile)
  inspectorBest = getBestModel(profile)
  const inst = profile.ollama.models
  const known = new Set(inspectorModels.map(m => m.ollamaName.split(":")[0]))
  const extras = inst.filter(n => !known.has(n.split(":")[0]))
  const allSel = [...inspectorModels.filter(m => m.fitsOnMachine || m.hardcoreMode), ...extras.map(n => ({ ollamaName: n, fitsOnMachine: true, hardcoreMode: true } as ModelCandidate))]
  inspectorIndex = Math.max(0, allSel.findIndex(m => inspectorBest && m.ollamaName === inspectorBest.ollamaName))
  inspectorPhase = 6
  buildInspector()
}

function buildModeScreen() {
  clearScreen()
  currentScreen = "chat"
  if (gateDecisions.length === 0) gateDecisions = generateGateDecisions()
  if (codeLines.length === 0) codeLines = generateCodeLines()
  if (worldInvariants.length === 0) { const g = generateInvariants(); worldInvariants = g.invs; worldTotalBytes = g.totalBytes }

  const modeLabels: Record<Mode, string> = {
    chat: "Chat", gate: "Gate Trace", code: "Code View",
    world: "World Model", trust: "Trust Boundary", playground: "Playground",
  }

  const root = new BoxRenderable(renderer, { id: "mode-root", flexDirection: "row", width: "auto", height: "auto", flexGrow: 1 })
  const sb = new BoxRenderable(renderer, {
    id: "sidebar", flexDirection: "column", width: 26, height: "auto",
    backgroundColor: "#1a1a2e", border: true, borderColor: "#333355", borderStyle: "single", padding: 1,
  })

  const items = [
    { id: "sb-t", content: " SYNTHCODE", fg: "#7c5cfc" },
    { id: "sb-s1", content: " ──────────────────────", fg: "#333355" },
    { id: "sb-ml", content: " Model", fg: "#888888" },
    { id: "sb-mn", content: ` ${model}`, fg: modelSource === "local" ? "#00e5a0" : "#9b7dff" },
    { id: "sb-mt", content: ` ${modelSource === "local" ? "LOCAL" : "CLOUD"}`, fg: "#888888" },
    { id: "sb-s2", content: " ──────────────────────", fg: "#333355" },
    { id: "sb-md", content: " Mode", fg: "#888888" },
  ]
  ;(Object.keys(modeLabels) as Mode[]).forEach(m => {
    items.push({ id: `sb-m-${m}`, content: activeMode === m ? ` > ${modeLabels[m]}` : `   ${modeLabels[m]}`, fg: activeMode === m ? "#00e5a0" : "#666666" })
  })
  items.push({ id: "sb-s3", content: " ──────────────────────", fg: "#333355" })
  const stats = getCacheStats()
  if (stats.patterns > 0) items.push({ id: "sb-cache", content: ` Cache: ${stats.patterns} learned`, fg: "#444444" })
  items.push({ id: "sb-h", content: " ^P palette  ^M models", fg: "#555555" })
  items.push({ id: "sb-h2", content: " /help for tools", fg: "#555555" })
  items.forEach(it => sb.add(new TextRenderable(renderer, { id: it.id, content: it.content, fg: it.fg })))
  root.add(sb)

  const main = new BoxRenderable(renderer, { id: "main-area", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1 })
  switch (activeMode) {
    case "gate": main.add(buildGateTrace(renderer, gateDecisions, gateFilter, termWidth - 26, termHeight, gateLiveIdx)); break
    case "code": main.add(buildCodeView(renderer, codeLines, codeCursor, termWidth - 26, termHeight)); break
    case "world": main.add(buildWorldModel(renderer, worldInvariants, worldTotalBytes, termWidth - 26)); break
    case "trust": main.add(buildTrustBoundary(renderer, termWidth - 26)); break
    case "playground": {
      const provider = PROVIDERS.find(p => p.base === apiBase) || PROVIDERS[0]
      const pgModels = provider.models.slice(0, 2)
      if (playgroundResults.length === 0) playgroundResults = pgModels.map(n => computeModelResult(n, []))
      main.add(buildPlayground(renderer, termWidth - 26, playgroundResults)); break
    }
    default: main.add(buildChatArea()); break
  }
  root.add(main)
  renderer.root.add(root)
}

function buildChatArea(): BoxRenderable {
  const area = new BoxRenderable(renderer, { id: "chat-area", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1 })
  const msgs = new BoxRenderable(renderer, { id: "msgs", flexDirection: "column", width: "auto", height: "auto", flexGrow: 1, padding: 1 })
  const mainW = termWidth - 26
  const maxLines = termHeight - 8

  if (messages.length === 0) {
    msgs.add(new TextRenderable(renderer, { id: "empty", content: "Type a message or use tools: /run /read /write /ls /edit /search", fg: "#555555" }))
  } else {
    const costs: number[] = messages.map(msg => {
      if (msg.role === "tool" && msg.toolResult) return 3 + Math.min(7, msg.toolResult.output.split("\n").length)
      return 2 + msg.content.split("\n").length + (msg.role === "assistant" && msg.gateVerdicts.length > 0 ? 1 : 0)
    })

    const totalCost = costs.reduce((a, b) => a + b, 0)
    const maxOffset = Math.max(0, messages.length - 1)
    scrollOffset = Math.min(scrollOffset, maxOffset)
    scrollOffset = Math.max(0, scrollOffset)

    let startIdx = 0
    if (totalCost > maxLines) {
      let acc = 0
      for (let si = messages.length - 1; si >= Math.max(0, scrollOffset); si--) {
        acc += costs[si]
        if (acc > maxLines) { startIdx = si + 1; break }
      }
      startIdx = Math.max(startIdx, scrollOffset)
    }

    const visEnd = messages.length
    if (startIdx > 0) {
      msgs.add(new TextRenderable(renderer, {
        id: "scr-top", content: `  ^ ${startIdx} older messages (Shift+Up/Down to scroll)`,
        fg: "#444444",
      }))
    }

    for (let idx = startIdx; idx < visEnd; idx++) {
      const msg = messages[idx]
      const isUser = msg.role === "user"
      const isTool = msg.role === "tool"

      if (isTool && msg.toolResult) {
        const tr = msg.toolResult
        const gateText = tr.gateVerdict ? (tr.gateVerdict.passed ? `[${tr.gateVerdict.gate}:PASS ${tr.gateVerdict.latencyMs}ms]` : `[${tr.gateVerdict.gate}:FAIL]`) : ""
        const bub = new BoxRenderable(renderer, { id: `b-${idx}`, flexDirection: "column", border: true, borderColor: "#9b7dff", borderStyle: "single", width: "auto" })
        bub.add(new TextRenderable(renderer, { id: `bl-${idx}`, content: `${tr.success ? "[OK]" : "[FAIL]"} ${tr.tool}  ${gateText}  ${tr.durationMs}ms`, fg: "#9b7dff", attributes: 1 }))
        const lines = tr.output.split("\n")
        lines.slice(0, 6).forEach((ln, j) => {
          bub.add(new TextRenderable(renderer, { id: `bc-${idx}-${j}`, content: `  ${ln.slice(0, mainW - 6)}`, fg: j < 2 ? "#cccccc" : "#666666" }))
        })
        if (lines.length > 6) bub.add(new TextRenderable(renderer, { id: `bc-${idx}-m`, content: `  ... ${lines.length - 6} more lines`, fg: "#444444" }))
        msgs.add(bub)
        continue
      }

      const label = isUser ? "You" : "SC"
      const bub = new BoxRenderable(renderer, { id: `b-${idx}`, flexDirection: "column", border: true, borderColor: isUser ? "#00cccc" : "#00cc66", borderStyle: "round", width: "auto" })
      bub.add(new TextRenderable(renderer, { id: `bl-${idx}`, content: label, fg: isUser ? "#00cccc" : "#00cc66", attributes: 1 }))
      msg.content.split("\n").forEach((ln, j) => {
        bub.add(new TextRenderable(renderer, { id: `bc-${idx}-${j}`, content: ln.slice(0, mainW - 4), fg: "#cccccc" }))
      })
      if (!isUser && msg.gateVerdicts.length > 0) {
        const allP = msg.gateVerdicts.every(v => v.passed)
        bub.add(new TextRenderable(renderer, {
          id: `bg-${idx}`,
          content: `${allP ? "[ALL PASS]" : `[${msg.gateVerdicts.filter(v => !v.passed).length} FAIL]`} ${msg.gateVerdicts.length} gates ${msg.gateVerdicts.reduce((s, v) => s + v.latencyMs, 0)}ms`,
          fg: allP ? "#1D9E75" : "#EF9F27",
        }))
      }
      msgs.add(bub)
    }
  }

  if (isThinking) msgs.add(new TextRenderable(renderer, { id: "thinking", content: "SynthCode is thinking...", fg: "#cccc00" }))
  area.add(msgs)

  const inp = new BoxRenderable(renderer, { id: "input", flexDirection: "row", width: "auto", height: 3, border: true, borderColor: "#333355", borderStyle: "single", alignItems: "center" })
  inp.add(new TextRenderable(renderer, { id: "prompt", content: "> ", fg: "#00cccc" }))
  inp.add(new TextRenderable(renderer, { id: "intxt", content: inputText + "\u2588", fg: "#ffffff" }))
  area.add(inp)

  if (commandPalette) {
    const pal = new BoxRenderable(renderer, {
      id: "palette", position: "absolute", bottom: 4, left: 28, width: 44,
      flexDirection: "column", backgroundColor: "#1a1a2e", border: true,
      borderColor: "#7c5cfc", borderStyle: "single", padding: 1, zIndex: 200,
    })
    pal.add(new TextRenderable(renderer, { id: "pal-t", content: "Commands" + (commandFilter ? `: ${commandFilter}` : ""), fg: "#7c5cfc" }))
    commandList.forEach((c, ci) => {
      pal.add(new TextRenderable(renderer, { id: `pal-${ci}`, content: `${ci === commandIndex ? "> " : "  "}${c.cmd.padEnd(20)} ${c.desc}`, fg: ci === commandIndex ? "#00e5a0" : "#888888" }))
    })
    if (commandList.length === 0) pal.add(new TextRenderable(renderer, { id: "pal-e", content: "  No matching commands", fg: "#666666" }))
    pal.add(new TextRenderable(renderer, { id: "pal-h", content: "Type to filter | Up/Down | Enter | Esc", fg: "#555555" }))
    area.add(pal)
  }

  if (modelPicker) {
    const mp = new BoxRenderable(renderer, {
      id: "mpicker", position: "absolute", bottom: 4, left: 28, width: 40,
      flexDirection: "column", backgroundColor: "#1a1a2e", border: true,
      borderColor: "#00cccc", borderStyle: "single", padding: 1, zIndex: 200,
    })
    mp.add(new TextRenderable(renderer, { id: "mp-t", content: "Switch Model", fg: "#00cccc", attributes: 1 }))
    const allModels = modelSource === "local"
      ? (profile?.ollama.models || [])
      : PROVIDERS.reduce<string[]>((a, p) => { if (p.base === apiBase) return p.models; return a }, PROVIDERS[0].models)
    allModels.forEach((m, mi) => {
      mp.add(new TextRenderable(renderer, {
        id: `mp-m-${mi}`,
        content: `${mi === modelPickerIdx ? "> " : "  "}${m}${m === model ? " [active]" : ""}`,
        fg: mi === modelPickerIdx ? "#00e5a0" : m === model ? "#00cc66" : "#888888",
      }))
    })
    mp.add(new TextRenderable(renderer, { id: "mp-h", content: "Up/Down | Enter | Esc", fg: "#555555" }))
    area.add(mp)
  }

  return area
}

function buildCommandPalette() { commandPalette = true; commandFilter = ""; commandIndex = 0; updateCommandList(); buildModeScreen() }
function closeCommandPalette() { commandPalette = false; commandFilter = ""; buildModeScreen() }
function openModelPicker() { modelPicker = true; modelPickerIdx = 0; buildModeScreen() }
function closeModelPicker() { modelPicker = false; buildModeScreen() }

function updateCommandList() {
  const all = [
    { cmd: "/run <cmd>", desc: "Execute shell command" },
    { cmd: "/read <path>", desc: "Read a file" },
    { cmd: "/write <path> <text>", desc: "Write to a file" },
    { cmd: "/ls <path>", desc: "List directory" },
    { cmd: "/edit <path> <desc>", desc: "Fast Apply edit" },
    { cmd: "/search <query>", desc: "Codebase search" },
    { cmd: "/models", desc: "Switch model (^M)" },
    { cmd: "/mode gate", desc: "^3 Gate Trace" },
    { cmd: "/mode code", desc: "^4 Code View" },
    { cmd: "/mode world", desc: "^5 World Model" },
    { cmd: "/mode trust", desc: "^6 Trust Boundary" },
    { cmd: "/mode playground", desc: "^7 Playground" },
    { cmd: "/clear", desc: "Clear history" },
    { cmd: "/help", desc: "Show all commands" },
    { cmd: "/setup", desc: "Model setup" },
    { cmd: "/quit", desc: "Exit SynthCode" },
  ]
  commandList = all.filter(c => c.cmd.includes(commandFilter))
  commandIndex = Math.min(commandIndex, Math.max(0, commandList.length - 1))
}

function executeCommand(text: string) {
  const parts = text.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const arg = parts.slice(1).join(" ")

  switch (cmd) {
    case "/commands": buildCommandPalette(); return
    case "/models": openModelPicker(); return
    case "/mode": {
      const modeMap: Record<string, Mode> = {
        chat: "chat", gate: "gate", trace: "gate",
        code: "code", world: "world", trust: "trust",
        playground: "playground",
      }
      const t = modeMap[arg.toLowerCase()]
      if (t) { activeMode = t } else { messages.push({ role: "assistant", content: "Usage: /mode <chat|gate|code|world|trust|playground>", gateVerdicts: [] }) }
      break
    }
    case "/clear": messages = []; scrollOffset = 0; break
    case "/help":
      messages.push({ role: "assistant", content: [
        "SynthCode Commands:",
        "  /run <cmd>            Execute shell command",
        "  /read <path>          Read a file",
        "  /write <path> <text>  Write to a file",
        "  /ls <path>            List directory",
        "  /edit <path> <desc>   Fast Apply edit",
        "  /search <query>       Codebase search",
        "  /models or ^M         Switch model",
        "  /mode <mode>          Switch mode",
        "  /commands or ^P       Command palette",
        "  /clear                Clear conversation",
        "  /setup                Return to model setup",
        "  /quit                 Exit",
        "",
        "  Shift+Up/Down: scroll history",
        "  ^1 Chat ^3 Gate ^4 Code ^5 World ^6 Trust ^7 Play",
      ].join("\n"), gateVerdicts: [] })
      break
    case "/setup": currentScreen = "setup"; buildSetup(); return
    case "/quit": process.exit(0)
    default: messages.push({ role: "assistant", content: `Unknown: ${cmd}. /help for commands.`, gateVerdicts: [] })
  }
  buildModeScreen()
}

async function executeToolInChat(tool: string, args: string) {
  messages.push({ role: "user", content: `/${tool} ${args}`, gateVerdicts: [] })
  isThinking = true; buildModeScreen()
  const route = routeToolCall(tool, args, args)
  if (route.correction?.blocked) {
    const r: ToolResult = { tool, success: false, output: `BLOCKED: ${route.correction.reason}`, gateVerdict: { gate: "contract", passed: false, latencyMs: 1 }, durationMs: 0 }
    messages.push({ role: "tool", content: r.output, gateVerdicts: [r.gateVerdict], toolResult: r })
    learn(args, tool, args, false, model)
  } else {
    const r = await executeToolCall(route.tool, route.args)
    if (route.correction?.corrections?.length) r.output = `[corrected: ${route.correction.corrections.join(", ")}] ${r.output.slice(0, 700)}`
    messages.push({ role: "tool", content: r.output.slice(0, 800), gateVerdicts: r.gateVerdict ? [r.gateVerdict] : [], toolResult: r })
    learn(args, route.tool, route.args, r.success, model)
    if (r.success) cacheResult(route.tool, route.args, r.output, true)
  }
  isThinking = false; buildModeScreen()
}

function parseToolBlocks(reply: string): { explanation: string; tools: { tool: string; args: string }[] } {
  const lines = reply.split("\n")
  const tools: { tool: string; args: string }[] = []
  const expl: string[] = []
  const toolRe = /^\/(run|read|write|ls|edit|search)\s+/
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (toolRe.test(line.trim())) {
      const match = line.trim().match(/^\/(\w+)\s+(.*)/)
      if (!match) { i++; continue }
      const tn = match[1], rest = match[2]
      if (tn === "write") {
        const pm = rest.match(/^(\S+)\s*([\s\S]*)/)
        if (pm) {
          const fp = pm[1]; let content = pm[2]
          if (!content.trim()) {
            i++; const cl: string[] = []
            while (i < lines.length && !toolRe.test(lines[i].trim())) { cl.push(lines[i]); i++ }
            content = cl.join("\n")
            if (content.trim()) tools.push({ tool: "write", args: JSON.stringify({ path: fp, content }) })
            continue
          } else { tools.push({ tool: "write", args: JSON.stringify({ path: fp, content }) }) }
        }
      } else { const tc = parseToolCall(line.trim()); if (tc) tools.push(tc) }
    } else { expl.push(line) }
    i++
  }
  return { explanation: expl.join("\n").trim(), tools }
}

async function sendChat(text: string) {
  messages.push({ role: "user", content: text, gateVerdicts: [] })
  inputText = ""; scrollOffset = messages.length

  const agentMsgs: { role: string; content: string }[] = [
    { role: "system", content: enrichSystemPrompt(SYSTEM_PROMPT) },
    { role: "user", content: text },
  ]

  for (let round = 0; round < MAX_AGENT_ROUNDS; round++) {
    isThinking = true; buildModeScreen()
    let reply = ""
    try {
      const api = getApiConfig()
      const resp = await fetch(api.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${api.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: agentMsgs }),
      })
      const data = await resp.json() as any
      reply = data.choices?.[0]?.message?.content
      if (!reply && reply !== "") reply = `(API error: ${data.error?.message || JSON.stringify(data).slice(0, 200)})`
    } catch (e: any) {
      messages.push({ role: "assistant", content: `Error: ${e?.message || "unknown"}`, gateVerdicts: [] })
      isThinking = false; buildModeScreen(); return
    }

    agentMsgs.push({ role: "assistant", content: reply })
    const parsed = parseToolBlocks(reply)
    if (parsed.explanation) {
      messages.push({ role: "assistant", content: parsed.explanation, gateVerdicts: verifyContent(parsed.explanation) })
      scrollOffset = messages.length; isThinking = false; buildModeScreen()
    }
    if (parsed.tools.length === 0) { isThinking = false; buildModeScreen(); return }

    for (const tc of parsed.tools) {
      isThinking = true; buildModeScreen()
      const route = routeToolCall(tc.tool, tc.args, text)
      let result: ToolResult

      if (route.correction?.blocked) {
        result = { tool: tc.tool, success: false, output: `BLOCKED: ${route.correction.reason}`, gateVerdict: { gate: "contract", passed: false, latencyMs: 1 }, durationMs: 0 }
        messages.push({ role: "tool", content: result.output, gateVerdicts: [{ gate: "contract", passed: false, latencyMs: 1, detail: route.correction.reason || "blocked" }], toolResult: result })
        agentMsgs.push({ role: "user", content: `[${tc.tool} BLOCKED ${route.correction.reason}] Try a different approach.` })
        learn(text, tc.tool, tc.args, false, model)
      } else if (route.cacheHit) {
        const c = route.cacheHit
        result = { tool: c.tool, success: c.success, output: `[CACHED] ${c.output.slice(0, 700)}`, gateVerdict: { gate: "dep_graph", passed: true, latencyMs: 0 }, durationMs: 0 }
        messages.push({ role: "tool", content: result.output.slice(0, 800), gateVerdicts: [result.gateVerdict], toolResult: result })
        agentMsgs.push({ role: "user", content: `[${c.tool} CACHED OK 0ms] ${c.output.slice(0, 1500)}` })
        learn(text, c.tool, c.args, true, model)
      } else {
        result = await executeToolCall(route.tool, route.args)
        if (route.correction?.corrections?.length) result.output = `[corrected: ${route.correction.corrections.join(", ")}] ${result.output.slice(0, 700)}`
        messages.push({ role: "tool", content: result.output.slice(0, 800), gateVerdicts: result.gateVerdict ? [result.gateVerdict] : [], toolResult: result })
        agentMsgs.push({ role: "user", content: `[${result.tool} ${result.success ? "OK" : "FAIL"} ${result.durationMs}ms] ${result.output.slice(0, 1500)}` })
        learn(text, route.tool, route.args, result.success, model)
        if (result.success) cacheResult(route.tool, route.args, result.output, true)
      }
      scrollOffset = messages.length; isThinking = false; buildModeScreen()
    }
    continue
  }
  messages.push({ role: "assistant", content: `[Agent reached max ${MAX_AGENT_ROUNDS} rounds]`, gateVerdicts: [] })
  isThinking = false; buildModeScreen()
}

async function animateGateTrace() {
  gateAnimating = true; gateDecisions = generateGateDecisions(); gateFilter = ""
  for (let i = 0; i < gateDecisions.length; i++) { gateLiveIdx = i; buildModeScreen(); await new Promise(r => setTimeout(r, 200 + Math.random() * 300)) }
  gateLiveIdx = -1; gateAnimating = false; buildModeScreen()
}

async function runPlayground() {
  playgroundRunning = true
  const prompt = "Write a function to validate JWT tokens with expiry checks and proper error handling"
  const provider = PROVIDERS.find(p => p.base === apiBase) || PROVIDERS[0]
  const modelNames = provider.models.slice(0, 2)
  playgroundResults = modelNames.map(n => computeModelResult(n, []))
  playgroundResults.forEach(r => r.status = "running"); buildModeScreen()
  for (let i = 0; i < modelNames.length; i++) {
    try {
      const api = getApiConfig()
      const resp = await fetch(api.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${api.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelNames[i], messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }] }),
      })
      const data = await resp.json() as any
      const reply = data.choices?.[0]?.message?.content || "(empty)"
      const verdicts = verifyContent(reply)
      const decisions: GateDecision[] = verdicts.map((v, vi) => ({
        step: `pg-${modelNames[i].slice(0, 8)}-${vi}`, neuralOut: v.detail, gateType: v.gate,
        decision: v.passed ? (v.latencyMs > 80 ? "VERIFIED" as const : "PASS" as const) : "FAIL-RETRY" as const,
        latencyMs: v.latencyMs, retryCount: v.passed ? 0 : 1,
      }))
      playgroundResults[i] = computeModelResult(modelNames[i], decisions)
      playgroundResults[i].status = "done"; playgroundResults[i].rawOutput = reply.slice(0, 60).replace(/\n/g, " ")
    } catch {
      playgroundResults[i] = computeModelResult(modelNames[i], generateGateDecisions()); playgroundResults[i].status = "done"; playgroundResults[i].rawOutput = "(mock - API error)"
    }
    buildModeScreen()
  }
  playgroundRunning = false; buildModeScreen()
}

async function handleKey(key: KeyEvent) {
  if (currentScreen === "splash") { buildSetup(); return }

  if (currentScreen === "setup") {
    if (key.name === "up") { selectedSetupOption = Math.max(0, selectedSetupOption - 1); buildSetup() }
    else if (key.name === "down") { selectedSetupOption = Math.min(1, selectedSetupOption + 1); buildSetup() }
    else if (key.name === "return") {
      if (selectedSetupOption === 0) { modelSource = "local"; inspectorPhase = 0; inspectorDone = false; buildInspector() }
      else { modelSource = "cloud"; cloudKeyInput = ""; cloudProviderIdx = 0; buildCloudSetup() }
    }
    return
  }

  if (currentScreen === "cloud-setup") {
    if (key.name === "escape") { buildSetup(); return }
    if (key.name === "up") { cloudProviderIdx = Math.max(0, cloudProviderIdx - 1); buildCloudSetup(); return }
    if (key.name === "down") { cloudProviderIdx = Math.min(PROVIDERS.length - 1, cloudProviderIdx + 1); buildCloudSetup(); return }
    if (key.name === "return") {
      if (cloudKeyInput.length > 0) {
        apiKey = cloudKeyInput
        apiBase = PROVIDERS[cloudProviderIdx].base
        cloudModelIdx = 0
        buildCloudModels()
      }
      return
    }
    if (key.name === "backspace") { cloudKeyInput = cloudKeyInput.slice(0, -1); buildCloudSetup(); return }
    if (key.sequence && key.sequence.length === 1 && !key.ctrl) { cloudKeyInput += key.sequence; buildCloudSetup(); return }
    return
  }

  if (currentScreen === "cloud-models") {
    const provider = PROVIDERS[cloudProviderIdx]
    if (key.name === "escape") { buildCloudSetup(); return }
    if (key.name === "up") { cloudModelIdx = Math.max(0, cloudModelIdx - 1); buildCloudModels(); return }
    if (key.name === "down") { cloudModelIdx = Math.min(provider.models.length - 1, cloudModelIdx + 1); buildCloudModels(); return }
    if (key.name === "return") {
      model = provider.models[cloudModelIdx]
      activeMode = "chat"
      buildModeScreen()
    }
    return
  }

  if (currentScreen === "inspector") {
    if (inspectorInstalling || inspectorDone) return
    if (key.name === "up") { inspectorIndex = Math.max(0, inspectorIndex - 1); buildInspector() }
    else if (key.name === "down") {
      const inst = profile?.ollama.models ?? []
      const known = new Set(inspectorModels.map(m => m.ollamaName.split(":")[0]))
      const extras = inst.filter(n => !known.has(n.split(":")[0]))
      const sel = [...inspectorModels.filter(m => m.fitsOnMachine || m.hardcoreMode), ...extras.map(n => ({ ollamaName: n, fitsOnMachine: true, hardcoreMode: true } as ModelCandidate))]
      inspectorIndex = sel.length === 0 ? 0 : Math.min(sel.length - 1, inspectorIndex + 1); buildInspector()
    } else if (key.name === "return") {
      const inst = profile?.ollama.models ?? []
      const known = new Set(inspectorModels.map(m => m.ollamaName.split(":")[0]))
      const extras = inst.filter(n => !known.has(n.split(":")[0]))
      const sel = [...inspectorModels.filter(m => m.fitsOnMachine || m.hardcoreMode), ...extras.map(n => ({ ollamaName: n, fitsOnMachine: true, hardcoreMode: true } as ModelCandidate))]
      const selected = sel[inspectorIndex]
      if (selected) {
        const isInst = inst.some(n => n.split(":")[0] === selected.ollamaName.split(":")[0])
        if (isInst) { model = selected.ollamaName; inspectorDone = true; activeMode = "chat"; buildModeScreen() }
        else {
          inspectorInstalling = true; inspectorInstallName = selected.ollamaName; buildInspector()
          try { await installModel(selected.ollamaName); model = selected.ollamaName } catch { model = inspectorBest?.ollamaName || model }
          inspectorDone = true; activeMode = "chat"; buildModeScreen()
        }
      }
    } else if (key.name === "escape") { model = inspectorBest?.ollamaName || model; activeMode = "chat"; buildModeScreen() }
    return
  }

  if (currentScreen === "chat") {
    if (key.ctrl && key.name === "c") process.exit(0)
    if (key.ctrl && key.name === "p") { buildCommandPalette(); return }
    if (key.ctrl && key.name === "m") { openModelPicker(); return }
    if (key.ctrl && key.name === "1") { activeMode = "chat"; buildModeScreen(); return }
    if (key.ctrl && key.name === "3") { activeMode = "gate"; buildModeScreen(); return }
    if (key.ctrl && key.name === "4") { activeMode = "code"; buildModeScreen(); return }
    if (key.ctrl && key.name === "5") { activeMode = "world"; buildModeScreen(); return }
    if (key.ctrl && key.name === "6") { activeMode = "trust"; buildModeScreen(); return }
    if (key.ctrl && key.name === "7") { activeMode = "playground"; buildModeScreen(); return }

    if (modelPicker) {
      if (key.name === "escape") { closeModelPicker(); return }
      const allModels = modelSource === "local"
        ? (profile?.ollama.models || [])
        : PROVIDERS.reduce<string[]>((a, p) => p.base === apiBase ? p.models : a, PROVIDERS[0].models)
      if (key.name === "up") { modelPickerIdx = Math.max(0, modelPickerIdx - 1); buildModeScreen(); return }
      if (key.name === "down") { modelPickerIdx = allModels.length === 0 ? 0 : Math.min(allModels.length - 1, modelPickerIdx + 1); buildModeScreen(); return }
      if (key.name === "return") {
        if (allModels[modelPickerIdx]) {
          model = allModels[modelPickerIdx]
          messages.push({ role: "assistant", content: `Switched to ${model}`, gateVerdicts: [] })
        }
        closeModelPicker(); return
      }
      return
    }

    if (commandPalette) {
      if (key.name === "escape") { closeCommandPalette(); return }
      if (key.name === "up") { commandIndex = Math.max(0, commandIndex - 1); buildModeScreen(); return }
      if (key.name === "down") { commandIndex = commandList.length === 0 ? 0 : Math.min(commandList.length - 1, commandIndex + 1); buildModeScreen(); return }
      if (key.name === "return") { const s = commandList[commandIndex]; if (s) { closeCommandPalette(); executeCommand(s.cmd) } return }
      if (key.name === "backspace" || key.name === "delete") { commandFilter = commandFilter.slice(0, -1); updateCommandList(); buildModeScreen(); return }
      if (key.sequence && key.sequence.length === 1 && !key.ctrl) { commandFilter += key.sequence; updateCommandList(); buildModeScreen(); return }
      return
    }

    if (activeMode === "code") {
      if (key.name === "up") { codeCursor = Math.max(0, codeCursor - 1); buildModeScreen() }
      else if (key.name === "down") { codeCursor = Math.min(codeLines.length - 1, codeCursor + 1); buildModeScreen() }
      else if (key.name === "escape") { activeMode = "chat"; buildModeScreen() }
      return
    }
    if (activeMode === "gate") {
      if (gateAnimating) return
      if (key.name === "r") { gateFilter = gateFilter === "FAIL-RETRY" ? "" : "FAIL-RETRY"; buildModeScreen() }
      else if (key.name === "c") { gateFilter = ""; buildModeScreen() }
      else if (key.name === "return") { animateGateTrace().catch(console.error) }
      else if (key.name === "escape") { activeMode = "chat"; buildModeScreen() }
      return
    }
    if (activeMode === "playground") {
      if (key.name === "escape") { activeMode = "chat"; buildModeScreen() }
      else if (key.name === "return" && !playgroundRunning) { runPlayground().catch(console.error) }
      return
    }
    if (activeMode === "world" || activeMode === "trust") {
      if (key.name === "escape") { activeMode = "chat"; buildModeScreen() }
      return
    }

    if (isThinking) {
      if (key.shift && key.name === "up") { scrollOffset = Math.max(0, scrollOffset - 1); buildModeScreen() }
      else if (key.shift && key.name === "down") { scrollOffset = Math.min(messages.length - 1, scrollOffset + 1); buildModeScreen() }
      return
    }

    if (key.shift && key.name === "up") { scrollOffset = Math.max(0, scrollOffset - 1); buildModeScreen(); return }
    if (key.shift && key.name === "down") { scrollOffset = Math.min(messages.length - 1, scrollOffset + 1); buildModeScreen(); return }

    if (key.name === "return") {
      const text = inputText.trim()
      if (!text) return
      const tc = parseToolCall(text)
      if (tc) { inputText = ""; executeToolInChat(tc.tool, tc.args).catch(console.error); return }
      if (text.startsWith("/")) { inputText = ""; if (text === "/commands") { buildCommandPalette(); return } executeCommand(text); return }
      if (text === "?") { inputText = ""; buildCommandPalette(); return }
      sendChat(text).catch(console.error)
    } else if (key.name === "backspace" || key.name === "delete") { inputText = inputText.slice(0, -1); buildModeScreen() }
    else if (key.name === "escape") { inputText = ""; buildModeScreen() }
    else if (key.sequence && key.sequence.length === 1 && !key.ctrl) { inputText += key.sequence; buildModeScreen() }
  }
}

async function main() {
  renderer = await createCliRenderer({ exitOnCtrlC: true, targetFps: 30, screenMode: "alternate-screen" })
  termWidth = renderer.terminalWidth
  termHeight = renderer.terminalHeight
  renderer.setBackgroundColor("#0d0d1a")
  renderer.keyInput.on("keypress", handleKey)
  renderer.on("resize", (w: number, h: number) => { termWidth = w; termHeight = h; if (currentScreen === "chat") buildModeScreen() })
  buildSplash()
}

main().catch(console.error)
