import { MachineInspector, type MachineProfile } from "../model/inspector.js";
import { AutoSelector, type SelectionRequest, type SelectionResult } from "../model/selector.js";
import { ProjectAnalyzer, type ProjectProfile } from "../model/project.js";
import { MODEL_CATALOG, type CatalogEntry } from "../model/catalog.js";
import {
  renderInspectScreen,
  renderCatalogScreen,
  renderLeaderboardScreen,
  renderModelDetails,
} from "../tui/index.js";
import { styled, C, type Style, terminalWidth } from "../tui/ansi.js";
import { panel, rule } from "../tui/panel.js";
import { ROUNDED, THICK } from "../tui/symbols.js";
import { benchmarkBar, gauge } from "../tui/bar.js";

export interface AdaptedConfig {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  dualPathVerifier: boolean;
}

type TaskType = "coding" | "reasoning" | "chat" | "agents";
type RunMode = "full" | "inspect" | "analyze" | "catalog" | "leaderboard" | "model";

function detectTask(project: ProjectProfile | null): TaskType {
  if (!project) return "coding";

  const frameworks = project.frameworks ?? [];
  const hasAgentFramework = frameworks.some(
    (f) =>
      f.name.toLowerCase().includes("langchain") ||
      f.name.toLowerCase().includes("crewai") ||
      f.name.toLowerCase().includes("autogen") ||
      f.name.toLowerCase().includes("semantic kernel") ||
      f.name.toLowerCase().includes("agentic")
  );
  if (hasAgentFramework) return "agents";

  if (project.hasTests) return "coding";

  const languages = project.languages ?? [];
  const dataLangs = ["Jupyter Notebook", "R", "Julia"];
  const dataShare = languages
    .filter((l) => dataLangs.includes(l.language))
    .reduce((sum, l) => sum + l.percentage, 0);
  if (dataShare > 30) return "reasoning";

  return "coding";
}

function buildAdaptedConfig(
  selection: SelectionResult,
  _profile: MachineProfile | null
): AdaptedConfig {
  const provider = selection.provider;
  const model = selection.model;
  const isLocal = provider === "ollama" || provider === "lmstudio";
  const maxTokens = 131072;
  const temperature = 0.2;
  const dualPathVerifier = isLocal;

  return {
    provider,
    model,
    maxTokens,
    temperature,
    dualPathVerifier,
  };
}

function renderAdaptTUI(
  machine: MachineProfile | null,
  project: ProjectProfile | null,
  selection: SelectionResult | null,
  config: AdaptedConfig | null
): string {
  const w = Math.min(terminalWidth(), 90);
  const accent: Style = { fg: C.synthAccent, bold: true };
  const muted: Style = { fg: C.synthMuted };
  const green: Style = { fg: C.synthGreen };
  const yellow: Style = { fg: C.synthYellow };

  const sections: string[] = [];

  sections.push("");
  sections.push(styled("  SynthCode Adapt", { fg: C.synthAccent, bold: true, underline: true }));
  sections.push(rule("self-adapting model selection", { char: "\u2500", style: muted, width: w }));
  sections.push("");

  if (machine) {
    sections.push(renderInspectScreen(machine));
    sections.push("");
  }

  if (project) {
    const lines: string[] = [];
    lines.push(styled("  Project Analysis", accent));
    lines.push(`  ${styled("Name", muted).padEnd(16)}  ${project.name}`);
    const topLangs = (project.languages ?? []).slice(0, 5);
    if (topLangs.length > 0) {
      const langStr = topLangs.map((l) => `${l.language} (${Math.round(l.percentage)}%)`).join(", ");
      lines.push(`  ${styled("Languages", muted).padEnd(16)}  ${langStr}`);
    }
    const fwStr = (project.frameworks ?? []).map((f) => f.name).join(", ");
    if (fwStr) lines.push(`  ${styled("Frameworks", muted).padEnd(16)}  ${fwStr}`);
    lines.push(`  ${styled("Size", muted).padEnd(16)}  ${project.totalFiles} files, ~${project.totalLinesOfCode.toLocaleString()} lines (${project.complexity})`);
    if (project.testFramework) lines.push(`  ${styled("Tests", muted).padEnd(16)}  ${project.testFramework}`);

    sections.push(panel(lines.join("\n"), { border: ROUNDED, borderStyle: muted, width: w, padding: 0 }));
    sections.push("");
  }

  if (selection && machine) {
    const lines: string[] = [];
    lines.push(styled("  Recommended Model", accent));
    lines.push("");

    const modelPanel = panel(
      [
        `  ${styled(selection.model, { fg: C.synthAccent, bold: true })}`,
        `  via ${styled(selection.provider, { fg: C.synthFg })}`,
        "",
        `  ${styled("Confidence", muted).padEnd(14)}  ${benchmarkBar(selection.confidence, 1, 20, { color: C.synthAccent, bgColor: [30, 30, 45] })}  ${styled(`${Math.round(selection.confidence * 100)}%`, { fg: C.synthAccent, bold: true })}`,
        "",
        `  ${styled("Reason", muted)}`,
        `  ${selection.reason}`,
        "",
        `  ${styled("Download", muted).padEnd(14)}  ${selection.needsDownload ? styled("Required", { fg: C.synthYellow }) : styled("Already installed", green)}`,
      ].join("\n"),
      { border: THICK, borderStyle: { fg: C.synthAccent }, width: 50, padding: 0 }
    );
    lines.push(modelPanel);

    if (selection.alternatives.length > 0) {
      lines.push("");
      lines.push(styled("  Alternatives", accent));
      const maxShow = Math.min(selection.alternatives.length, 4);
      for (let i = 0; i < maxShow; i++) {
        const alt = selection.alternatives[i];
        lines.push(`  ${styled(`${i + 1}.`, muted)}  ${styled(alt.model, { fg: C.synthFg })}  via ${styled(alt.provider, muted)}`);
        lines.push(`      ${styled(alt.reason, { fg: C.synthDim })}`);
      }
    }

    sections.push(lines.join("\n"));
    sections.push("");
  }

  if (config) {
    const lines: string[] = [];
    lines.push(styled("  SynthCode Config", accent));
    const modelStr = `${config.provider}:${config.model}`;
    const obj = {
      model: modelStr,
      dualPathVerifier: config.dualPathVerifier,
      maxTurns: 100,
      context: { maxTokens: config.maxTokens },
    };
    lines.push("  " + JSON.stringify(obj, null, 2).replace(/\n/g, "\n  "));

    sections.push(panel(lines.join("\n"), { border: ROUNDED, borderStyle: muted, width: w, padding: 0 }));
  }

  return sections.join("\n");
}

function parseArgs(args: string[]): {
  mode: RunMode;
  json: boolean;
  taskOverride: TaskType | null;
  modelId: string | null;
  family: string | null;
} {
  let mode: RunMode = "full";
  let json = false;
  let taskOverride: TaskType | null = null;
  let modelId: string | null = null;
  let family: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--inspect":
        mode = "inspect";
        break;
      case "--analyze":
        mode = "analyze";
        break;
      case "--json":
        json = true;
        break;
      case "catalog":
        mode = "catalog";
        break;
      case "leaderboard":
        mode = "leaderboard";
        break;
      case "model":
        mode = "model";
        modelId = args[++i] ?? null;
        break;
      case "--task": {
        const val = args[++i];
        const valid: TaskType[] = ["coding", "reasoning", "chat", "agents"];
        if (!val || !valid.includes(val as TaskType)) {
          throw new Error(
            `--task requires one of: ${valid.join(", ")} (got ${val ?? "nothing"})`
          );
        }
        taskOverride = val as TaskType;
        break;
      }
      case "--model": {
        modelId = args[++i] ?? null;
        break;
      }
      case "--family": {
        family = args[++i] ?? null;
        break;
      }
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  return { mode, json, taskOverride, modelId, family };
}

export async function runAdaptCommand(args: string[]): Promise<void> {
  const { mode, json, taskOverride, modelId, family } = parseArgs(args);

  let machine: MachineProfile | null = null;

  if (
    mode === "full" ||
    mode === "inspect" ||
    mode === "catalog" ||
    mode === "leaderboard"
  ) {
    const inspector = new MachineInspector();
    machine = await inspector.inspect();
  }

  if (mode === "catalog") {
    console.log(
      renderCatalogScreen(machine, {
        task: taskOverride ?? undefined,
        family: family ?? undefined,
      })
    );
    return;
  }

  if (mode === "leaderboard") {
    console.log(
      renderLeaderboardScreen(taskOverride ?? "coding", machine)
    );
    return;
  }

  if (mode === "model") {
    if (!modelId) {
      console.error("Usage: synthcode adapt model <model-id>");
      process.exit(1);
    }
    const entry = MODEL_CATALOG.find(
      (e) =>
        e.id === modelId ||
        e.ollamaTags.includes(modelId) ||
        e.name.toLowerCase() === modelId.toLowerCase()
    );
    if (!entry) {
      console.error(`Model not found: ${modelId}`);
      console.error(
        `Available: ${MODEL_CATALOG.filter((e) => e.ollamaTags.length > 0)
          .map((e) => e.ollamaTags[0])
          .join(", ")}`
      );
      process.exit(1);
    }
    console.log(renderModelDetails(entry, machine));
    return;
  }

  let project: ProjectProfile | null = null;
  let selection: SelectionResult | null = null;

  if (mode === "full" || mode === "analyze") {
    try {
      const analyzer = new ProjectAnalyzer();
      project = await analyzer.analyze(process.cwd());
    } catch {
      project = null;
    }
  }

  if (mode === "full" && machine) {
    const task: TaskType = taskOverride ?? detectTask(project);
    const selector = new AutoSelector(machine);
    const request: SelectionRequest = { task, preferLocal: true };
    selection = selector.select(request);
  }

  const config =
    selection && machine ? buildAdaptedConfig(selection, machine) : null;

  if (json) {
    console.log(
      JSON.stringify({ machine, project, selection, config }, null, 2)
    );
  } else {
    console.log(renderAdaptTUI(machine, project, selection, config));
  }
}
