import { MODEL_CATALOG, type CatalogEntry } from "./catalog.js";
import type { MachineProfile, InstalledModel } from "./inspector.js";

export interface SelectionRequest {
  task: "coding" | "reasoning" | "chat" | "agents";
  projectSize?: "small" | "medium" | "large";
  preferLocal?: boolean;
  preferSpeed?: boolean;
  maxWaitMs?: number;
}

export interface SelectionResult {
  model: string;
  provider: string;
  reason: string;
  confidence: number;
  alternatives: Array<{ model: string; provider: string; reason: string }>;
  needsDownload: boolean;
  estimatedDownloadGB?: number;
}

export interface RankedCandidate {
  model: string;
  provider: string;
  score: number;
  reason: string;
  needsDownload: boolean;
  estimatedDownloadGB?: number;
  installed: boolean;
  fitsInVram: boolean;
  fitsInRam: boolean;
  isMoe: boolean;
  supportsToolUse: boolean;
}

interface Benchmarks {
  liveCodeBench?: number;
  sweBench?: number;
  humaneval?: number;
  mmlu?: number;
  codeforcesElo?: number;
  hasTools?: number;
  mtBench?: number;
}

const CLOUD_PROVIDER_CONFIG: Record<string, () => string | undefined> = {
  anthropic: () => process.env["ANTHROPIC_API_KEY"],
  openai: () => process.env["OPENAI_API_KEY"],
};

const CLOUD_MODELS: Array<{
  model: string;
  provider: string;
  task: string[];
  benchmarks: Benchmarks;
  recommendedFor: string[];
  supportsToolUse: boolean;
}> = [
  {
    model: "claude-sonnet-4-20250514",
    provider: "anthropic",
    task: ["coding", "reasoning", "agents", "chat"],
    benchmarks: {
      liveCodeBench: 92,
      sweBench: 72,
      humaneval: 96,
      mmlu: 89,
      codeforcesElo: 2100,
      hasTools: 1.0,
      mtBench: 9.1,
    },
    recommendedFor: ["coding", "agents", "reasoning"],
    supportsToolUse: true,
  },
  {
    model: "claude-haiku-3-5-20241022",
    provider: "anthropic",
    task: ["coding", "chat"],
    benchmarks: {
      liveCodeBench: 78,
      sweBench: 45,
      humaneval: 88,
      mmlu: 84,
      codeforcesElo: 1500,
      hasTools: 1.0,
      mtBench: 8.5,
    },
    recommendedFor: ["chat", "coding"],
    supportsToolUse: true,
  },
  {
    model: "gpt-4o",
    provider: "openai",
    task: ["coding", "reasoning", "agents", "chat"],
    benchmarks: {
      liveCodeBench: 86,
      sweBench: 60,
      humaneval: 92,
      mmlu: 88,
      codeforcesElo: 1900,
      hasTools: 1.0,
      mtBench: 9.0,
    },
    recommendedFor: ["coding", "reasoning", "agents"],
    supportsToolUse: true,
  },
  {
    model: "gpt-4o-mini",
    provider: "openai",
    task: ["coding", "chat"],
    benchmarks: {
      liveCodeBench: 72,
      sweBench: 38,
      humaneval: 87,
      mmlu: 82,
      codeforcesElo: 1400,
      hasTools: 1.0,
      mtBench: 8.2,
    },
    recommendedFor: ["chat"],
    supportsToolUse: true,
  },
];

function parseParamSize(sizes: string[]): number {
  if (sizes.length === 0) return 0;
  const parsed = sizes
    .map((s) => {
      const match = s.match(/([\d.]+)\s*(T|B|M|K)?/i);
      if (!match) return 0;
      const val = parseFloat(match[1]);
      const unit = (match[2] ?? "B").toUpperCase();
      if (unit === "T") return val * 1000;
      if (unit === "B") return val;
      if (unit === "M") return val / 1000;
      return val;
    })
    .filter((v) => v > 0);
  return parsed.length > 0 ? Math.max(...parsed) : 0;
}

export class AutoSelector {
  constructor(private profile: MachineProfile) {}

  select(request: SelectionRequest): SelectionResult {
    const ranked = this.rankAll(request);

    if (ranked.length === 0) {
      return {
        model: "claude-sonnet-4-20250514",
        provider: "anthropic",
        reason:
          "No local models available or viable. Falling back to Claude Sonnet cloud — ensure ANTHROPIC_API_KEY is set.",
        confidence: 0.3,
        alternatives: [],
        needsDownload: false,
      };
    }

    const top = ranked[0];
    const alternatives = ranked.slice(1, 4).map((c) => ({
      model: c.model,
      provider: c.provider,
      reason: c.reason,
    }));

    const confidence = this.computeConfidence(top, ranked);

    return {
      model: top.model,
      provider: top.provider,
      reason: top.reason,
      confidence,
      alternatives,
      needsDownload: top.needsDownload,
      estimatedDownloadGB: top.estimatedDownloadGB,
    };
  }

  rankAll(request: SelectionRequest): RankedCandidate[] {
    const candidates: RankedCandidate[] = [];
    const installed = this.profile.installedModels ?? [];
    const installedTags = new Set(installed.map((m) => m.tag));
    const effectiveVram = this.resolveEffectiveVram();
    const availableRam = this.profile.availableRamGB ?? 0;

    for (const entry of MODEL_CATALOG) {
      for (const tag of entry.ollamaTags) {
        const isInstalled = installedTags.has(tag);
        const fitsInVram =
          entry.minVramGB <= effectiveVram || effectiveVram === 0;
        const fitsInRam = entry.minRamGB <= availableRam;

        if (!fitsInVram && !fitsInRam) continue;

        const taskScore = this.scoreForTask(entry.benchmarks ?? {}, request.task);
        const adjustments = this.computeAdjustments(
          entry,
          isInstalled,
          effectiveVram,
          request
        );
        const totalScore = taskScore + adjustments;

        const provider = this.resolveProvider(tag, isInstalled);
        if (provider === null) continue;

        candidates.push({
          model: tag,
          provider,
          score: totalScore,
          reason: this.buildReason(entry, request.task, isInstalled, fitsInVram),
          needsDownload: !isInstalled,
          estimatedDownloadGB: isInstalled
            ? undefined
            : entry.quantizations.length > 0
            ? entry.quantizations[0].sizeGB
            : undefined,
          installed: isInstalled,
          fitsInVram,
          fitsInRam,
          isMoe: entry.architecture === "moe",
          supportsToolUse: entry.supportsToolUse ?? false,
        });
      }
    }

    for (const cloud of CLOUD_MODELS) {
      if (!cloud.task.includes(request.task)) continue;

      const apiKey = CLOUD_PROVIDER_CONFIG[cloud.provider]?.();
      if (!apiKey) continue;

      const taskScore = this.scoreForTask(cloud.benchmarks, request.task);
      const localPenalty = request.preferLocal ? -0.15 : 0;
      const cloudAdjustment =
        cloud.supportsToolUse && request.task === "agents" ? 0.1 : 0;

      candidates.push({
        model: cloud.model,
        provider: cloud.provider,
        score: taskScore + localPenalty + cloudAdjustment,
        reason: `Cloud fallback: ${cloud.model} via ${cloud.provider}`,
        needsDownload: false,
        installed: false,
        fitsInVram: false,
        fitsInRam: false,
        isMoe: false,
        supportsToolUse: cloud.supportsToolUse,
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates;
  }

  canRunLocally(ollamaTag: string): boolean {
    const entry = this.findCatalogEntry(ollamaTag);
    if (!entry) return false;

    const effectiveVram = this.resolveEffectiveVram();
    return (
      entry.minVramGB <= effectiveVram ||
      entry.minRamGB <= (this.profile.availableRamGB ?? 0)
    );
  }

  findInstalled(request: SelectionRequest): InstalledModel | null {
    const installed = this.profile.installedModels ?? [];
    const taskMap: Record<string, string[]> = {
      coding: ["coding", "code", "programming"],
      reasoning: ["reasoning", "math", "logic"],
      chat: ["chat", "conversation", "general"],
      agents: ["agents", "tool-use", "agentic", "coding"],
    };

    const keywords = taskMap[request.task] ?? [];

    for (const model of installed) {
      const entry = this.findCatalogEntry(model.tag);
      if (!entry) continue;

      const recommended = entry.recommendedFor.map((r) => r.toLowerCase());
      const matchesTask = recommended.some((r) =>
        keywords.some((kw) => r.includes(kw))
      );
      if (matchesTask) return model;
    }

    return null;
  }

  recommendDownload(
    request: SelectionRequest
  ): { model: string; sizeGB: number; reason: string } | null {
    const installed = this.findInstalled(request);
    if (installed) {
      return {
        model: installed.tag,
        sizeGB: 0,
        reason: `Already have ${installed.tag} installed for ${request.task}`,
      };
    }

    const effectiveVram = this.resolveEffectiveVram();
    const availableRam = this.profile.availableRamGB ?? 0;

    let best: CatalogEntry | null = null;
    let bestScore = -Infinity;

    for (const entry of MODEL_CATALOG) {
      const fitsGpu = entry.minVramGB <= effectiveVram;
      const fitsCpu = entry.minRamGB <= availableRam;
      if (!fitsGpu && !fitsCpu) continue;

      if (
        !entry.recommendedFor.some((r) =>
          r.toLowerCase().includes(request.task)
        )
      )
        continue;

      const score = this.scoreForTask(entry.benchmarks ?? {}, request.task);

      const downloadSizeGB =
        entry.quantizations.length > 0 ? entry.quantizations[0].sizeGB : 0;
      const sizePenalty = downloadSizeGB * 0.02;
      const adjusted = score - sizePenalty;

      if (adjusted > bestScore) {
        bestScore = adjusted;
        best = entry;
      }
    }

    if (!best || !best.ollamaTags.length) return null;

    const tag = best.ollamaTags[0];
    const downloadSize =
      best.quantizations.length > 0 ? best.quantizations[0].sizeGB : 0;
    return {
      model: tag,
      sizeGB: downloadSize,
      reason: `Best ${request.task} model that fits your hardware: ${tag} (${best.family}, ${this.summarizeParams(best)})`,
    };
  }

  private resolveEffectiveVram(): number {
    const gpus = this.profile.gpus;
    if (!gpus || gpus.length === 0) return 0;
    return gpus.reduce((sum, gpu) => sum + gpu.vramGB, 0);
  }

  private resolveProvider(
    ollamaTag: string,
    isInstalled: boolean
  ): string | null {
    const ollamaProvider = this.profile.providers.find(
      (p) => p.name === "ollama" && p.available
    );
    if (isInstalled && ollamaProvider) return "ollama";

    const lmProvider = this.profile.providers.find(
      (p) => p.name === "lmstudio" && p.available
    );
    if (lmProvider) {
      const lmModels = this.profile.installedModels.filter(
        (m) => m.provider === "lmstudio" && m.tag === ollamaTag
      );
      if (lmModels.length > 0) return "lmstudio";
    }

    if (ollamaProvider) return "ollama";

    return null;
  }

  private scoreForTask(benchmarks: Benchmarks, task: string): number {
    const b = benchmarks;
    const lc = b.liveCodeBench ?? 0;
    const swe = b.sweBench ?? 0;
    const he = b.humaneval ?? 0;
    const mmlu = b.mmlu ?? 0;
    const elo = b.codeforcesElo ?? 0;
    const tools = b.hasTools ?? 0;

    switch (task) {
      case "coding":
        return lc * 0.5 + swe * 0.3 + he * 0.2;
      case "reasoning":
        return mmlu * 0.4 + (elo / 2500) * 100 * 0.3 + swe * 0.3;
      case "agents":
        return swe * 0.5 + lc * 0.3 + tools * 100 * 0.2;
      case "chat":
        return (
          (b.mtBench ?? 0) * 10 * 0.5 +
          mmlu * 0.3 +
          he * 0.2
        );
      default:
        return lc * 0.4 + swe * 0.3 + mmlu * 0.3;
    }
  }

  private computeAdjustments(
    entry: CatalogEntry,
    isInstalled: boolean,
    effectiveVram: number,
    request: SelectionRequest
  ): number {
    let adj = 0;

    if (isInstalled) {
      adj += 5.0;
    } else {
      adj -= 2.0;
    }

    if (
      effectiveVram > 0 &&
      entry.minVramGB > effectiveVram * 0.8
    ) {
      const overflow =
        (entry.minVramGB - effectiveVram * 0.8) / effectiveVram;
      adj -= overflow * 10;
    }

    if (entry.architecture === "moe" && effectiveVram > 0 && effectiveVram < 16) {
      const maxParam = parseParamSize(entry.parameterSizes);
      const activeParam = parseParamSize([entry.activeParams ?? "0"]);
      if (maxParam > 0) {
        const activeRatio = activeParam / maxParam;
        adj += (1 - activeRatio) * 3.0;
      } else {
        adj += 0.33 * 3.0;
      }
    }

    if (request.task === "agents" && entry.supportsToolUse) {
      adj += 4.0;
    }

    if (request.task === "agents" && !entry.supportsToolUse) {
      adj -= 8.0;
    }

    if (request.preferSpeed) {
      const paramCount = parseParamSize(entry.parameterSizes);
      if (paramCount <= 7) adj += 2.0;
      else if (paramCount <= 13) adj += 1.0;
      else if (paramCount >= 70) adj -= 1.5;
    }

    return adj;
  }

  private computeConfidence(
    top: RankedCandidate,
    ranked: RankedCandidate[]
  ): number {
    let conf = 0.5;

    if (top.installed) conf += 0.15;
    if (top.supportsToolUse) conf += 0.05;
    if (top.fitsInVram) conf += 0.1;

    if (ranked.length >= 2) {
      const gap = top.score - ranked[1].score;
      conf += Math.min(gap / 20, 0.2);
    }

    if (!top.installed && !top.needsDownload) {
      conf += 0.05;
    }

    return Math.max(0, Math.min(1, conf));
  }

  private buildReason(
    entry: CatalogEntry,
    task: string,
    isInstalled: boolean,
    fitsInVram: boolean
  ): string {
    const parts: string[] = [];

    parts.push(
      isInstalled
        ? `Installed ${entry.family}`
        : `${entry.family} (${this.summarizeParams(entry)})`
    );

    const b = entry.benchmarks ?? {};
    const highlights: string[] = [];
    if (task === "coding" && b.liveCodeBench) {
      highlights.push(`LiveCodeBench ${b.liveCodeBench}`);
    }
    if (task === "reasoning" && b.mmlu) {
      highlights.push(`MMLU ${b.mmlu}`);
    }
    if ((task === "coding" || task === "agents") && b.sweBench) {
      highlights.push(`SWE-bench ${b.sweBench}`);
    }
    if (task === "agents" && entry.supportsToolUse) {
      highlights.push("tool-use");
    }
    if (entry.architecture === "moe") {
      highlights.push("MoE");
    }

    if (highlights.length > 0) {
      parts.push(`[${highlights.join(", ")}]`);
    }

    if (!fitsInVram) {
      parts.push("(CPU inference)");
    }

    return parts.join(" ");
  }

  private summarizeParams(entry: CatalogEntry): string {
    const sizes = entry.parameterSizes;
    if (sizes.length === 0) return "unknown params";
    return sizes.join("/");
  }

  private findCatalogEntry(ollamaTag: string): CatalogEntry | null {
    for (const entry of MODEL_CATALOG) {
      if (entry.ollamaTags.includes(ollamaTag)) return entry;
    }
    return null;
  }
}
