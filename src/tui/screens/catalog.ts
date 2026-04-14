import { styled, padAnsi, terminalWidth, stripAnsi, C, type Style, RESET } from "../ansi.js";
import { panel, rule } from "../panel.js";
import { table, type Column, type TableOpts } from "../table.js";
import { gauge, benchmarkBar, sparkline } from "../bar.js";
import { ROUNDED, THICK, HEAVY_HEAD, BULLET, DIAMOND, STAR, CHECK, CROSS, ARROW_R } from "../symbols.js";
import type { CatalogEntry } from "../../model/catalog.js";
import { MODEL_CATALOG } from "../../model/catalog.js";
import type { MachineProfile } from "../../model/inspector.js";

export function renderCatalogScreen(
  machine: MachineProfile | null,
  filter?: {
    task?: string;
    onlyLocal?: boolean;
    family?: string;
  }
): string {
  const w = Math.min(terminalWidth(), 100);
  const accent: Style = { fg: C.synthAccent, bold: true };
  const muted: Style = { fg: C.synthMuted };
  const green: Style = { fg: C.synthGreen };
  const yellow: Style = { fg: C.synthYellow };

  const sections: string[] = [];
  sections.push(styled("SynthCode Model Catalog", accent));
  sections.push(rule(`${MODEL_CATALOG.length} models`, { char: "\u2500", style: muted, width: w }));
  sections.push("");

  const effectiveVram = machine
    ? machine.gpus.reduce((s, g) => s + g.vramGB, 0)
    : 0;

  let entries = MODEL_CATALOG;
  if (filter?.onlyLocal) {
    entries = entries.filter((e) => e.minVramGB <= effectiveVram || e.minRamGB <= (machine?.availableRamGB ?? 0));
  }
  if (filter?.family) {
    entries = entries.filter((e) => e.family === filter.family);
  }
  if (filter?.task) {
    entries = entries.filter((e) => e.recommendedFor.includes(filter.task as any));
  }

  const grouped = groupByFamily(entries);
  for (const [family, models] of Object.entries(grouped)) {
    sections.push(renderFamilyGroup(family, models, effectiveVram, machine?.availableRamGB ?? 0, w, accent, muted, green, yellow));
    sections.push("");
  }

  return sections.join("\n");
}

function renderFamilyGroup(
  family: string,
  entries: CatalogEntry[],
  vram: number,
  ram: number,
  width: number,
  accent: Style,
  muted: Style,
  green: Style,
  yellow: Style
): string {
  const lines: string[] = [];
  const maker = entries[0].maker;
  const makerStyle: Style = { fg: C.synthMuted };

  lines.push(`${styled(family, accent)}  ${styled(`by ${maker}`, makerStyle)}`);

  for (const entry of entries) {
    const canRun = entry.minVramGB <= vram || entry.minRamGB <= ram;
    const statusIcon = canRun ? styled(CHECK, green) : styled(CROSS, { fg: C.synthDim });
    const nameStyle: Style = canRun ? { fg: C.synthFg } : { fg: C.synthDim };
    const params = entry.parameterSizes.join("/");
    const arch = entry.architecture === "moe" ? styled("MoE", { fg: C.orange }) : "";
    const activeLabel = entry.activeParams ? styled(`(${entry.activeParams} active)`, { fg: C.orange }) : "";
    const sizeStr = entry.quantizations.length > 0
      ? styled(`${entry.quantizations[0].sizeGB} GB`, { fg: C.synthYellow })
      : "";
    const ctxLabel = formatContext(entry.contextWindow);
    const toolsLabel = entry.supportsToolUse ? styled("tools", { fg: C.teal }) : "";
    const thinkLabel = entry.supportsThinking ? styled("think", { fg: C.purple }) : "";
    const visionLabel = entry.supportsVision ? styled("vision", { fg: C.pink }) : "";
    const caps = [toolsLabel, thinkLabel, visionLabel].filter(Boolean).join(" ");

    const tags = entry.ollamaTags.slice(0, 2).map((t) => styled(t, muted)).join(", ");

    lines.push(
      `  ${statusIcon}  ${styled(`${params}`, nameStyle)} ${arch} ${activeLabel}  ${sizeStr}  ${ctxLabel}  ${caps}`
    );
    lines.push(
      `      ${tags}`
    );

    if (entry.benchmarks) {
      const bm = entry.benchmarks;
      const bmParts: string[] = [];
      if (bm.liveCodeBench) bmParts.push(`LCB ${bm.liveCodeBench}`);
      if (bm.sweBench) bmParts.push(`SWE ${bm.sweBench}`);
      if (bm.mmlu) bmParts.push(`MMLU ${bm.mmlu}`);
      if (bm.humaneval) bmParts.push(`HE ${bm.humaneval}`);
      if (bm.codeforcesElo) bmParts.push(`Elo ${bm.codeforcesElo}`);
      lines.push(`      ${styled(bmParts.join("  "), { fg: C.synthDim })}`);
    }
  }

  return panel(lines.join("\n"), { border: ROUNDED, borderStyle: { fg: C.synthDim }, width, padding: 0 });
}

export function renderLeaderboardScreen(
  task: "coding" | "reasoning" | "agents" | "chat" = "coding",
  machine: MachineProfile | null
): string {
  const w = Math.min(terminalWidth(), 90);
  const accent: Style = { fg: C.synthAccent, bold: true };
  const muted: Style = { fg: C.synthMuted };

  const effectiveVram = machine
    ? machine.gpus.reduce((s, g) => s + g.vramGB, 0)
    : 0;

  const scored = MODEL_CATALOG
    .filter((e) => e.openWeight && e.ollamaTags.length > 0)
    .map((e) => ({
      entry: e,
      score: scoreForTask(e, task),
      canRun: e.minVramGB <= effectiveVram || e.minRamGB <= (machine?.availableRamGB ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

  const sections: string[] = [];
  sections.push(styled("SynthCode Model Leaderboard", accent));
  sections.push(rule(`${task} performance ranking`, { char: "\u2500", style: muted, width: w }));
  sections.push("");

  const maxScore = scored.length > 0 ? scored[0].score : 100;
  const barWidth = 30;

  const rows = scored.map((s, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? styled("\u2605", { fg: [255, 215, 0] }) : rank === 2 ? styled("\u2605", { fg: [192, 192, 192] }) : rank === 3 ? styled("\u2605", { fg: [205, 127, 50] }) : `${rank}`.padStart(2);
    const name = s.canRun ? styled(s.entry.name, { fg: C.synthFg }) : styled(s.entry.name, { fg: C.synthDim });
    const scoreStr = styled(s.score.toFixed(1), { fg: C.synthAccent, bold: true });
    const barStr = benchmarkBar(s.score, maxScore, barWidth, {
      color: s.canRun ? C.synthAccent : C.synthDim,
      bgColor: s.canRun ? [30, 40, 60] : [25, 25, 35],
    });
    const runLabel = s.canRun ? styled("RUN", { fg: C.synthGreen }) : styled("--", { fg: C.synthDim });
    const sizeStr = s.entry.quantizations.length > 0
      ? `${s.entry.quantizations[0].sizeGB} GB`.padStart(7)
      : "       ";

    return `${medal}  ${name.padEnd(30)}  ${barStr}  ${scoreStr}  ${runLabel}  ${sizeStr}`;
  });

  sections.push(...rows);
  sections.push("");
  sections.push(styled(`  ${DIAMOND} Ranked by ${task} score  ${DIAMOND} Can run on your machine`, muted));

  return sections.join("\n");
}

export function renderModelDetails(
  entry: CatalogEntry,
  machine: MachineProfile | null
): string {
  const w = Math.min(terminalWidth(), 80);
  const accent: Style = { fg: C.synthAccent, bold: true };
  const muted: Style = { fg: C.synthMuted };
  const green: Style = { fg: C.synthGreen };
  const yellow: Style = { fg: C.synthYellow };

  const effectiveVram = machine
    ? machine.gpus.reduce((s, g) => s + g.vramGB, 0)
    : 0;
  const canRun = entry.minVramGB <= effectiveVram || entry.minRamGB <= (machine?.availableRamGB ?? 0);

  const sections: string[] = [];
  sections.push(styled(`${entry.name}`, { fg: C.synthAccent, bold: true }));
  sections.push(rule(`${entry.maker}  ${entry.openWeight ? "Open Weight" : "Proprietary"}`, { char: "\u2500", style: muted, width: w }));
  sections.push("");

  sections.push(renderDetailRow("Family", entry.family, muted));
  sections.push(renderDetailRow("Parameters", entry.parameterSizes.join(", "), muted));
  if (entry.activeParams) {
    sections.push(renderDetailRow("Active Params", entry.activeParams, { fg: C.orange }));
  }
  sections.push(renderDetailRow("Architecture", entry.architecture.toUpperCase(), muted));
  sections.push(renderDetailRow("Context", formatContext(entry.contextWindow), muted));
  sections.push(renderDetailRow("Released", entry.released, muted));
  sections.push("");

  sections.push(styled("  Capabilities", accent));
  sections.push(renderDetailRow("Tool Use", entry.supportsToolUse ? styled("Yes", green) : styled("No", { fg: C.synthDim }), muted));
  sections.push(renderDetailRow("Streaming", entry.supportsStreaming ? styled("Yes", green) : styled("No", { fg: C.synthDim }), muted));
  sections.push(renderDetailRow("Vision", entry.supportsVision ? styled("Yes", green) : styled("No", { fg: C.synthDim }), muted));
  sections.push(renderDetailRow("Thinking", entry.supportsThinking ? styled("Yes", green) : styled("No", { fg: C.synthDim }), muted));
  sections.push("");

  sections.push(styled("  Requirements", accent));
  const vramBar = benchmarkBar(entry.minVramGB, 48, 20, {
    color: canRun ? C.synthGreen : C.synthRed,
    bgColor: [35, 35, 50],
    showPercent: true,
  });
  sections.push(renderDetailRow("Min VRAM", `${entry.minVramGB} GB  ${vramBar}`, muted));
  sections.push(renderDetailRow("Min RAM", `${entry.minRamGB} GB`, muted));
  sections.push(renderDetailRow("Can Run", canRun ? styled("Yes", { fg: C.synthGreen, bold: true }) : styled("No", { fg: C.synthRed, bold: true }), muted));
  sections.push("");

  if (entry.quantizations.length > 0) {
    sections.push(styled("  Quantizations", accent));
    for (const q of entry.quantizations) {
      sections.push(`  ${BULLET}  ${styled(q.name, { fg: C.synthFg })}  ${styled(`${q.sizeGB} GB`, yellow)}`);
    }
    sections.push("");
  }

  if (entry.benchmarks) {
    sections.push(styled("  Benchmarks", accent));
    const bm = entry.benchmarks;
    const barW = 25;
    if (bm.liveCodeBench != null) {
      sections.push(renderBenchmarkRow("LiveCodeBench", bm.liveCodeBench, 100, barW, C.synthAccent, muted));
    }
    if (bm.sweBench != null) {
      sections.push(renderBenchmarkRow("SWE-bench", bm.sweBench, 100, barW, C.synthGreen, muted));
    }
    if (bm.humaneval != null) {
      sections.push(renderBenchmarkRow("HumanEval", bm.humaneval, 100, barW, C.teal, muted));
    }
    if (bm.mmlu != null) {
      sections.push(renderBenchmarkRow("MMLU", bm.mmlu, 100, barW, C.purple, muted));
    }
    if (bm.codeforcesElo != null) {
      sections.push(renderBenchmarkRow("Codeforces", bm.codeforcesElo, 2500, barW, C.orange, muted));
    }
    sections.push("");
  }

  if (entry.ollamaTags.length > 0) {
    sections.push(styled("  Ollama Tags", accent));
    for (const tag of entry.ollamaTags) {
      sections.push(`  ${ARROW_R}  ${styled(tag, { fg: C.synthAccent })}`);
    }
    sections.push("");
  }

  sections.push(styled("  Recommended For", accent));
  sections.push(`  ${entry.recommendedFor.map((r) => styled(r, { fg: C.synthFg })).join(", ")}`);

  return panel(sections.join("\n"), { border: ROUNDED, borderStyle: { fg: C.synthDim }, width: w, padding: 0 });
}

function renderDetailRow(label: string, value: string, labelStyle: Style): string {
  const padded = padAnsi(styled(label.padEnd(14), labelStyle), 14);
  return `  ${padded}  ${value}`;
}

function renderBenchmarkRow(
  name: string,
  value: number,
  max: number,
  barWidth: number,
  color: [number, number, number],
  labelStyle: Style
): string {
  const barStr = benchmarkBar(value, max, barWidth, { color, bgColor: [35, 35, 50] });
  const valueStr = typeof max === "number" && max > 100 ? `${value}` : `${value}`;
  return `  ${padAnsi(styled(name.padEnd(14), labelStyle), 14)}  ${barStr}  ${styled(valueStr, { fg: color, bold: true })}`;
}

function scoreForTask(entry: CatalogEntry, task: string): number {
  const bm = entry.benchmarks ?? {};
  const lc = bm.liveCodeBench ?? 0;
  const swe = bm.sweBench ?? 0;
  const he = bm.humaneval ?? 0;
  const mmlu = bm.mmlu ?? 0;
  const elo = bm.codeforcesElo ?? 0;
  const tools = entry.supportsToolUse ? 1 : 0;

  switch (task) {
    case "coding":
      return lc * 0.5 + swe * 0.3 + he * 0.2;
    case "reasoning":
      return mmlu * 0.4 + (elo / 2500) * 100 * 0.3 + swe * 0.3;
    case "agents":
      return swe * 0.5 + lc * 0.3 + tools * 100 * 0.2;
    default:
      return lc * 0.4 + swe * 0.3 + mmlu * 0.3;
  }
}

function groupByFamily(entries: CatalogEntry[]): Record<string, CatalogEntry[]> {
  const groups: Record<string, CatalogEntry[]> = {};
  for (const e of entries) {
    if (!groups[e.family]) groups[e.family] = [];
    groups[e.family].push(e);
  }
  return groups;
}

function formatContext(tokens: number): string {
  if (tokens >= 1048576) return `${(tokens / 1048576).toFixed(0)}M ctx`;
  if (tokens >= 1024) return `${(tokens / 1024).toFixed(0)}K ctx`;
  return `${tokens} ctx`;
}
