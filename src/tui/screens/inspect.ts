import { styled, padAnsi, terminalWidth, C, type Style, RESET } from "../ansi.js";
import { panel, rule } from "../panel.js";
import { type BorderSet, ROUNDED, THICK, CHECK, CROSS, BULLET, DIAMOND, STAR } from "../symbols.js";
import { gauge, benchmarkBar } from "../bar.js";
import type { MachineProfile, GPUInfo, ProviderAvailability, InstalledModel } from "../../model/inspector.js";

export function renderInspectScreen(machine: MachineProfile): string {
  const w = Math.min(terminalWidth(), 80);
  const accent: Style = { fg: C.synthAccent, bold: true };
  const muted: Style = { fg: C.synthMuted };
  const green: Style = { fg: C.synthGreen };
  const red: Style = { fg: C.synthRed };
  const yellow: Style = { fg: C.synthYellow };

  const sections: string[] = [];

  sections.push(styled("SynthCode Adapt", { fg: C.synthAccent, bold: true }));
  sections.push(rule("Machine Inspection", { char: "\u2500", style: muted, width: w }));
  sections.push("");

  sections.push(renderSystemInfo(machine, w, accent, muted));
  sections.push("");

  if (machine.gpus.length > 0) {
    sections.push(renderGPUInfo(machine.gpus, accent, muted, green));
    sections.push("");
  }

  sections.push(renderProviders(machine.providers, accent, green, red, muted));
  sections.push("");

  if (machine.installedModels.length > 0) {
    sections.push(renderInstalledModels(machine.installedModels, accent, muted));
  }

  return sections.join("\n");
}

function renderSystemInfo(
  m: MachineProfile,
  w: number,
  accent: Style,
  muted: Style
): string {
  const lines: string[] = [];

  lines.push(styled("  System", accent));
  lines.push(
    `  ${styled("Hostname", muted)}  ${m.hostname}`
  );
  lines.push(
    `  ${styled("Platform", muted)}  ${m.platform}/${m.arch}`
  );
  lines.push(
    `  ${styled("CPU", muted)}      ${m.cpuModel}`
  );
  lines.push(
    `  ${styled("Cores", muted)}    ${m.cpuCores}`
  );

  const ramUsed = m.totalRamGB - m.availableRamGB;
  const ramPct = (ramUsed / m.totalRamGB) * 100;
  const ramBar = gauge(ramUsed, m.totalRamGB, 20, {
    filledStyle: { fg: C.synthAccent },
    emptyStyle: muted,
    label: `${m.availableRamGB.toFixed(1)} GB free`,
  });
  lines.push(
    `  ${styled("RAM", muted)}      ${m.totalRamGB.toFixed(1)} GB  ${ramBar}`
  );

  return panel(lines.join("\n"), { border: ROUNDED, borderStyle: muted, width: w, padding: 0 });
}

function renderGPUInfo(
  gpus: GPUInfo[],
  accent: Style,
  muted: Style,
  green: Style
): string {
  const lines: string[] = [];
  lines.push(styled("  Graphics", accent));

  for (const gpu of gpus) {
    const typeLabel = gpu.type === "apple-silicon"
      ? styled("Apple Silicon", green)
      : styled(gpu.type.toUpperCase(), { fg: C.orange });
    const vramLabel = gpu.vramGB > 0
      ? `  ${styled(`${gpu.vramGB.toFixed(1)} GB`, { fg: C.synthYellow })}`
      : "";
    lines.push(`  ${DIAMOND} ${gpu.name}  ${typeLabel}${vramLabel}`);
  }

  return lines.join("\n");
}

function renderProviders(
  providers: ProviderAvailability[],
  accent: Style,
  green: Style,
  red: Style,
  muted: Style
): string {
  const lines: string[] = [];
  lines.push(styled("  Providers", accent));

  for (const p of providers) {
    const icon = p.available ? styled(CHECK, green) : styled(CROSS, { fg: C.synthDim });
    const name = p.available ? styled(p.name, { fg: C.synthFg }) : styled(p.name, muted);
    const details: string[] = [];
    if (p.version) details.push(styled(`v${p.version}`, { fg: C.synthMuted }));
    if (p.installedModels != null && p.installedModels > 0) {
      details.push(styled(`${p.installedModels} models`, { fg: C.synthMuted }));
    }
    if (p.endpoint) details.push(styled(p.endpoint, { fg: C.synthDim }));
    const detailStr = details.length > 0 ? `  ${details.join("  ")}` : "";
    lines.push(`  ${icon}  ${name}${detailStr}`);
  }

  return lines.join("\n");
}

function renderInstalledModels(
  models: InstalledModel[],
  accent: Style,
  muted: Style
): string {
  const lines: string[] = [];
  lines.push(styled("  Installed Models", accent));

  for (const m of models) {
    const sizeStr = m.sizeGB > 0 ? styled(`  ${m.sizeGB.toFixed(1)} GB`, { fg: C.synthYellow }) : "";
    const quantStr = m.quantization ? styled(`  ${m.quantization}`, muted) : "";
    lines.push(`  ${BULLET}  ${styled(m.tag, { fg: C.synthFg })}${sizeStr}${quantStr}`);
  }

  return lines.join("\n");
}
