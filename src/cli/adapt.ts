import { MachineInspector, type MachineProfile } from "../model/inspector.js";
import { AutoSelector, type SelectionRequest, type SelectionResult } from "../model/selector.js";
import { ProjectAnalyzer, type ProjectProfile } from "../model/project.js";

export interface AdaptedConfig {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  dualPathVerifier: boolean;
}

type TaskType = "coding" | "reasoning" | "chat" | "agents";
type RunMode = "full" | "inspect" | "analyze";

const BOX_TOP = "\u250C" + "\u2500".repeat(37) + "\u2510";
const BOX_BOTTOM = "\u2514" + "\u2500".repeat(37) + "\u2518";
const BOX_SIDE = "\u2502";

function wrapBoxLine(text: string): string {
  const inner = 37;
  if (text.length <= inner) {
    return `${BOX_SIDE}  ${text.padEnd(inner)}${BOX_SIDE}`;
  }
  return `${BOX_SIDE}  ${text.slice(0, inner - 1)}\u2026${BOX_SIDE}`;
}

function formatGB(gb: number): string {
  return gb.toFixed(1);
}

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

function renderMachineSection(machine: MachineProfile): string {
  const lines: string[] = [];

  lines.push(
    `Machine: ${machine.hostname} (${machine.cpuModel})`
  );
  lines.push(`  CPU: ${machine.cpuCores} cores`);
  lines.push(
    `  RAM: ${formatGB(machine.totalRamGB)} GB total, ${formatGB(machine.availableRamGB)} GB available`
  );

  if (machine.gpus.length > 0) {
    for (const gpu of machine.gpus) {
      const vram = gpu.vramGB > 0 ? ` (${formatGB(gpu.vramGB)} GB)` : "";
      lines.push(`  GPU: ${gpu.name}${vram}`);
    }
  }

  if (machine.hasMetal) {
    lines.push("  Metal: yes (Apple Silicon)");
  }

  return lines.join("\n");
}

function renderProvidersSection(machine: MachineProfile): string {
  const lines: string[] = [];
  lines.push("Providers:");

  const providers = machine.providers ?? [];

  if (providers.length === 0) {
    lines.push("  (none detected)");
  } else {
    for (const p of providers) {
      const check = p.available ? "+" : "-";
      const parts: string[] = [p.name];
      if (p.version) parts.push(`v${p.version}`);
      if (p.installedModels != null && p.installedModels > 0) {
        parts.push(`${p.installedModels} models`);
      }
      lines.push(`  [${check}] ${parts.join(" ")}`);
    }
  }

  return lines.join("\n");
}

function renderModelsSection(machine: MachineProfile): string {
  const lines: string[] = [];
  lines.push("Installed Models:");

  const models = machine.installedModels ?? [];

  if (models.length === 0) {
    lines.push("  (none)");
  } else {
    for (const m of models) {
      const size = m.sizeGB > 0 ? `${formatGB(m.sizeGB)} GB` : "";
      const quant = m.quantization ? ` (${m.quantization})` : "";
      lines.push(`  ${m.tag.padEnd(24)} ${size}${quant}`);
    }
  }

  return lines.join("\n");
}

function renderProjectSection(project: ProjectProfile): string {
  const lines: string[] = [];

  lines.push(`Project: ${project.name}`);

  const langs = project.languages ?? [];
  const topLangs = langs.slice(0, 5);
  if (topLangs.length > 0) {
    const langStr = topLangs
      .map((l) => `${l.language} (${Math.round(l.percentage)}%)`)
      .join(", ");
    lines.push(`  Languages: ${langStr}`);
  }

  const frameworks = project.frameworks ?? [];
  if (frameworks.length > 0) {
    lines.push(`  Framework: ${frameworks.map((f) => f.name).join(", ")}`);
  }

  const sizeLabel = project.complexity;
  lines.push(
    `  Size: ${project.totalFiles} files, ~${project.totalLinesOfCode.toLocaleString()} lines (${sizeLabel})`
  );

  if (project.testFramework) {
    lines.push(`  Tests: ${project.testFramework}`);
  }

  return lines.join("\n");
}

function renderSelectionSection(selection: SelectionResult): string {
  const lines: string[] = [];

  lines.push("Recommended Model:");
  lines.push(`  ${BOX_TOP}`);

  const via = `via ${selection.provider}`;
  lines.push(wrapBoxLine(`${selection.model} ${via}`));
  lines.push(wrapBoxLine(`Confidence: ${Math.round(selection.confidence * 100)}%`));

  const reason = selection.reason ?? "No reason provided.";
  const reasonLines = reason.match(/.{1,37}/g) ?? [reason];
  for (const rl of reasonLines) {
    lines.push(wrapBoxLine(rl.trim()));
  }

  lines.push(`  ${BOX_BOTTOM}`);

  if (selection.alternatives.length > 0) {
    lines.push("");
    lines.push("  Alternatives:");
    const maxShow = Math.min(selection.alternatives.length, 4);
    for (let i = 0; i < maxShow; i++) {
      const alt = selection.alternatives[i];
      lines.push(
        `    ${i + 1}. ${alt.model} via ${alt.provider}`
      );
    }
  }

  return lines.join("\n");
}

function renderConfigSection(config: AdaptedConfig): string {
  const lines: string[] = [];
  lines.push("Recommended SynthCode Config:");

  const modelStr = `${config.provider}:${config.model}`;
  const obj = {
    model: modelStr,
    dualPathVerifier: config.dualPathVerifier,
    maxTurns: 100,
    context: { maxTokens: config.maxTokens },
  };

  lines.push("  " + JSON.stringify(obj, null, 2).replace(/\n/g, "\n  "));

  return lines.join("\n");
}

function formatReport(
  machine: MachineProfile | null,
  project: ProjectProfile | null,
  selection: SelectionResult | null,
  config: AdaptedConfig | null
): string {
  const sections: string[] = [];

  sections.push("SynthCode Adapt -- Machine Intelligence Report");
  sections.push("=".repeat(47));
  sections.push("");

  if (machine) {
    sections.push(renderMachineSection(machine));
    sections.push("");
    sections.push(renderProvidersSection(machine));
    sections.push("");
    sections.push(renderModelsSection(machine));
    sections.push("");
  }

  if (project) {
    sections.push(renderProjectSection(project));
    sections.push("");
  }

  if (selection) {
    sections.push(renderSelectionSection(selection));
    sections.push("");
  }

  if (config) {
    sections.push(renderConfigSection(config));
  }

  return sections.join("\n");
}

function parseArgs(args: string[]): {
  mode: RunMode;
  json: boolean;
  taskOverride: TaskType | null;
} {
  let mode: RunMode = "full";
  let json = false;
  let taskOverride: TaskType | null = null;

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
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  return { mode, json, taskOverride };
}

export async function runAdaptCommand(args: string[]): Promise<void> {
  const { mode, json, taskOverride } = parseArgs(args);

  let machine: MachineProfile | null = null;
  let project: ProjectProfile | null = null;
  let selection: SelectionResult | null = null;

  if (mode === "full" || mode === "inspect") {
    const inspector = new MachineInspector();
    machine = await inspector.inspect();
  }

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

    const request: SelectionRequest = {
      task,
      preferLocal: true,
    };

    selection = selector.select(request);
  }

  const config =
    selection && machine ? buildAdaptedConfig(selection, machine) : null;

  if (json) {
    console.log(
      JSON.stringify({ machine, project, selection, config }, null, 2)
    );
  } else {
    console.log(formatReport(machine, project, selection, config));
  }
}
