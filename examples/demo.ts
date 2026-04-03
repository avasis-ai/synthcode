import { setTimeout as sleep } from "node:timers/promises";

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const DIM = `${ESC}2m`;
const BOLD = `${ESC}1m`;
const HIDDEN = `${ESC}8m`;

const FG = (n: number) => `${ESC}38;5;${n}m`;
const BG = (n: number) => `${ESC}48;5;${n}m`;

const CYAN = FG(51);
const BLUE = FG(39);
const WHITE = FG(231);
const GREEN = FG(82);
const YELLOW = FG(226);
const RED = FG(196);
const GRAY = FG(243);
const DIM_GRAY = FG(241);
const LIGHT_BLUE = FG(75);
const MAGENTA = FG(177);

const BG_DARK = BG(236);
const BG_ACCENT = BG(237);

function line(color: string, text: string, indent = 0) {
  const pad = "  ".repeat(indent);
  process.stdout.write(`${pad}${color}${text}${RESET}\n`);
}

function blank() {
  process.stdout.write("\n");
}

async function typeText(text: string, baseDelay = 25) {
  process.stdout.write(`${WHITE}`);
  for (const char of text) {
    process.stdout.write(char);
    const jitter = Math.random() * 30;
    await sleep(baseDelay + jitter);
  }
  process.stdout.write(`${RESET}\n`);
}

async function typeLines(lines: string[], baseDelay = 30) {
  for (const l of lines) {
    await typeText(l, baseDelay);
    await sleep(60);
  }
}

const BANNER = [
  "╭─────────────────────────────────────────╮",
  "│                                         │",
  `│          ${BOLD}${CYAN}S Y N T H${RESET}                       │`,
  "│                                         │",
  `│   ${DIM_GRAY}Synthesize any LLM into an agent${RESET}      │`,
  "│                                         │",
  "╰─────────────────────────────────────────╯",
];

const TOOL_CALLS: Array<{ icon: string; label: string; color: string; detail: string }> = [
  { icon: "$", label: "bash", color: CYAN, detail: "npm init -y" },
  { icon: "$", label: "bash", color: CYAN, detail: "npm install express" },
  { icon: "$", label: "bash", color: CYAN, detail: "touch src/index.ts src/routes.ts" },
  { icon: "W", label: "file_write", color: MAGENTA, detail: "src/index.ts (24 lines)" },
  { icon: "W", label: "file_write", color: MAGENTA, detail: "src/routes.ts (18 lines)" },
  { icon: "W", label: "file_write", color: MAGENTA, detail: "tests/api.test.ts (32 lines)" },
  { icon: "$", label: "bash", color: CYAN, detail: "npm test" },
];

async function spinnerFrames(ms: number): Promise<void> {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const steps = Math.floor(ms / 50);
  for (let i = 0; i < steps; i++) {
    process.stdout.write(`\r  ${DIM_GRAY}${frames[i % frames.length]}${RESET}`);
    await sleep(50);
  }
  process.stdout.write("\r  \n");
}

async function showToolCall(tool: typeof TOOL_CALLS[0], simulateWork = false) {
  const tag = `${tool.color}[${tool.icon} ${tool.label}]${RESET}`;
  process.stdout.write(`  ${DIM_GRAY}│${RESET}  ${tag} ${GRAY}${tool.detail}${RESET}`);
  if (simulateWork) {
    await sleep(1200);
    process.stdout.write(`\r  ${DIM_GRAY}│${RESET}  ${tag} ${GRAY}${tool.detail}${RESET} ${GREEN}\u2713${RESET}\n`);
  } else {
    await sleep(250);
    process.stdout.write(` ${GREEN}\u2713${RESET}\n`);
  }
}

async function progressBar(label: string, pct: number) {
  const width = 28;
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  const bar = `${BLUE}${"\u2588".repeat(filled)}${BG_DARK}${" ".repeat(empty)}${RESET}`;
  process.stdout.write(
    `  ${DIM_GRAY}${label.padEnd(12)}${RESET} ${bar} ${WHITE}${String(pct).padStart(3)}%${RESET}\n`
  );
}

async function run() {
  blank();
  for (const row of BANNER) {
    process.stdout.write(`${BG_DARK} ${row} ${RESET}\n`);
  }
  blank();

  process.stdout.write(`  ${GREEN}\u25b6${RESET} ${YELLOW}synthcode run${RESET} ${WHITE}"Create a REST API with tests"${RESET}\n`);
  blank();

  await sleep(400);

  line(DIM_GRAY, "Model: claude-sonnet-4 | Tools: 7 | Context: 200K tokens");
  blank();

  await sleep(300);

  await typeLines([
    "I'll create a REST API with Express.js and add tests.",
    "Let me start by setting up the project structure.",
  ]);

  blank();
  await sleep(200);

  line(DIM_GRAY, "\u250c\u2500 Tool Calls");
  await showToolCall(TOOL_CALLS[0]);
  await showToolCall(TOOL_CALLS[1]);
  await showToolCall(TOOL_CALLS[2]);

  blank();
  await sleep(200);

  await typeLines([
    "Now I'll create the main server file with Express routes",
    "and a test suite using Vitest.",
  ]);

  blank();
  await showToolCall(TOOL_CALLS[3]);
  await showToolCall(TOOL_CALLS[4]);
  await showToolCall(TOOL_CALLS[5]);

  blank();
  await sleep(200);

  await typeLines(["Let me run the tests to verify everything works."]);

  blank();
  await showToolCall(TOOL_CALLS[6], true);

  blank();
  await sleep(150);

  process.stdout.write(`  ${DIM_GRAY}\u2504${RESET} ${GREEN}Tests:${RESET}\n`);
  line(GREEN, "  \u2713 GET /api/health      \u2190 200 OK");
  line(GREEN, "  \u2713 GET /api/users       \u2190 200 OK");
  line(GREEN, "  \u2713 POST /api/users      \u2190 201 Created");
  blank();

  await sleep(200);

  await typeLines([
    "Done! REST API with 3 endpoints, all tests passing.",
  ]);

  blank();
  await sleep(300);

  line(DIM_GRAY, "\u2500".repeat(42));

  blank();

  line(DIM_GRAY, "  Session Stats");
  blank();
  line(WHITE, "  Tokens:", 0);
  line(GRAY, "    4,821 in  |  1,203 out  |  2 turns", 0);
  blank();
  line(WHITE, "  Tools:", 0);
  line(GRAY, "    5 calls (3 bash, 2 file_write)", 0);
  blank();
  line(WHITE, "  Context:", 0);
  line(GRAY, "    8,024 / 200,000 tokens", 0);
  await progressBar("Used", 4);
  blank();

  line(DIM_GRAY, "\u2500".repeat(42));

  blank();

  process.stdout.write(`  ${DIM_GRAY}ready in${RESET} ${WHITE}3.2s${RESET} ${DIM_GRAY}\u00b7${RESET} ${GREEN}success${RESET}\n`);

  blank();
}

run().catch(() => process.exit(1));
