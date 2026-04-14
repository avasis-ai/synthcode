import { execSync } from "child_process";
import * as os from "os";

export interface SystemProfile {
  cpu: { model: string; cores: number; speed: string; loadAvg: [number, number, number] };
  memory: {
    totalGB: number;
    availableGB: number;
    usedGB: number;
    usagePercent: number;
    swapGB: number;
    compressedGB: number;
  };
  gpu: { model: string; vramGB: number; metal: string; cores: number };
  disk: { totalGB: number; freeGB: number; usedPercent: number };
  platform: { os: string; arch: string; kernel: string; hostname: string };
  ollama: { installed: boolean; path: string; models: string[] };
  battery: { percent: number; charging: boolean; timeRemaining: string };
  processes: number;
  neuralScore: number;
}

export interface ModelCandidate {
  name: string;
  ollamaName: string;
  params: string;
  sizeGB: number;
  minRamGB: number;
  specialty: string;
  tier: "slm" | "mlm" | "llm";
  fitsOnMachine: boolean;
  hardcoreMode: boolean;
  ollamaCommand: string;
}

const MODEL_DB = [
  {
    name: "Qwen2.5-Coder",
    ollamaName: "qwen2.5-coder:7b",
    params: "7B",
    sizeGB: 4.0,
    minRamGB: 8,
    specialty: "Coding",
    tier: "slm" as const,
  },
  {
    name: "DeepSeek-Coder-V2-Lite",
    ollamaName: "deepseek-coder-v2:latest",
    params: "7B",
    sizeGB: 4.1,
    minRamGB: 8,
    specialty: "Coding",
    tier: "slm" as const,
  },
  {
    name: "Phi-3-Mini",
    ollamaName: "phi3:3.8b",
    params: "3.8B",
    sizeGB: 2.2,
    minRamGB: 4,
    specialty: "Reasoning",
    tier: "slm" as const,
  },
  {
    name: "Llama-3.2",
    ollamaName: "llama3.2:8b",
    params: "8B",
    sizeGB: 4.7,
    minRamGB: 8,
    specialty: "General",
    tier: "slm" as const,
  },
  {
    name: "Mistral-7B",
    ollamaName: "mistral:7b",
    params: "7B",
    sizeGB: 4.0,
    minRamGB: 8,
    specialty: "General",
    tier: "slm" as const,
  },
  {
    name: "CodeLlama",
    ollamaName: "codellama:7b",
    params: "7B",
    sizeGB: 3.9,
    minRamGB: 8,
    specialty: "Coding",
    tier: "slm" as const,
  },
  {
    name: "StarCoder2",
    ollamaName: "starcoder2:7b",
    params: "7B",
    sizeGB: 4.1,
    minRamGB: 8,
    specialty: "Coding",
    tier: "slm" as const,
  },
  {
    name: "Gemma-2",
    ollamaName: "gemma2:9b",
    params: "9B",
    sizeGB: 5.0,
    minRamGB: 8,
    specialty: "General",
    tier: "slm" as const,
  },
  {
    name: "Qwen2.5-Coder-14B",
    ollamaName: "qwen2.5-coder:14b",
    params: "14B",
    sizeGB: 8.0,
    minRamGB: 16,
    specialty: "Coding",
    tier: "mlm" as const,
  },
  {
    name: "DeepSeek-Coder-V2",
    ollamaName: "deepseek-coder-v2:16b",
    params: "16B",
    sizeGB: 9.0,
    minRamGB: 16,
    specialty: "Coding",
    tier: "mlm" as const,
  },
  {
    name: "Mixtral 8x7B",
    ollamaName: "mixtral:8x7b",
    params: "47B",
    sizeGB: 27.5,
    minRamGB: 32,
    specialty: "General",
    tier: "llm" as const,
  },
  {
    name: "Llama-3.1-70B",
    ollamaName: "llama3.1:70b",
    params: "70B",
    sizeGB: 40.0,
    minRamGB: 48,
    specialty: "General",
    tier: "llm" as const,
  },
];

const BYTES_PER_GB = 1024 * 1024 * 1024;
const KB_PER_GB = 1024 * 1024;

function safeExec(command: string): string {
  try {
    return execSync(command, { encoding: "utf-8", timeout: 10000 }).trim();
  } catch {
    return "";
  }
}

function parseGPU(): { model: string; vramGB: number; metal: string; cores: number } {
  const output = safeExec("system_profiler SPDisplaysDataType 2>/dev/null");
  if (!output) {
    return { model: "Unknown", vramGB: 0, metal: "Unknown", cores: 0 };
  }

  let model = "Unknown";
  let vramGB = 0;
  let metal = "Unknown";
  let cores = 0;

  const chipMatch = output.match(/Chipset Model:\s*(.+)/);
  if (chipMatch) {
    model = chipMatch[1].trim();
  }

  const vramMatch = output.match(/VRAM \(Total\):\s*(\d+)\s*MB/i);
  if (vramMatch) {
    vramGB = parseFloat(vramMatch[1]) / 1024;
  }

  const metalMatch = output.match(/Metal Support:\s*(.+)/);
  if (metalMatch) {
    metal = metalMatch[1].trim();
  }

  const coresMatch = output.match(/Total Number of Cores:\s*(\d+)/);
  if (coresMatch) {
    cores = parseInt(coresMatch[1], 10);
  }

  return { model, vramGB, metal, cores };
}

function parseDisk(): { totalGB: number; freeGB: number; usedPercent: number } {
  const output = safeExec("df -k / 2>/dev/null");
  if (!output) {
    return { totalGB: 0, freeGB: 0, usedPercent: 0 };
  }

  const lines = output.split("\n");
  if (lines.length < 2) {
    return { totalGB: 0, freeGB: 0, usedPercent: 0 };
  }

  const parts = lines[1].split(/\s+/);
  if (parts.length < 4) {
    return { totalGB: 0, freeGB: 0, usedPercent: 0 };
  }

  const totalKB = parseInt(parts[1], 10);
  const freeKB = parseInt(parts[3], 10);
  const totalGB = totalKB / KB_PER_GB;
  const freeGB = freeKB / KB_PER_GB;
  const usedPercent = totalKB > 0 ? ((totalKB - freeKB) / totalKB) * 100 : 0;

  return { totalGB, freeGB, usedPercent };
}

function detectOllama(): { installed: boolean; path: string; models: string[] } {
  const ollamaPath = safeExec("which ollama 2>/dev/null");
  if (!ollamaPath) {
    return { installed: false, path: "", models: [] };
  }

  const listOutput = safeExec("ollama list 2>/dev/null");
  const models: string[] = [];

  if (listOutput) {
    const lines = listOutput.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const name = line.split(/\s+/)[0];
        if (name) {
          models.push(name);
        }
      }
    }
  }

  return { installed: true, path: ollamaPath, models };
}

function parseBattery(): { percent: number; charging: boolean; timeRemaining: string } {
  const output = safeExec("pmset -g batt 2>/dev/null");
  if (!output) {
    return { percent: 0, charging: false, timeRemaining: "N/A" };
  }

  let percent = 0;
  let charging = false;
  let timeRemaining = "N/A";

  const percentMatch = output.match(/(\d+)%/);
  if (percentMatch) {
    percent = parseInt(percentMatch[1], 10);
  }

  if (/charged|charging|AC Power/i.test(output)) {
    charging = true;
  }

  const timeMatch = output.match(/(\d+:\d+)\s+remaining/i);
  if (timeMatch) {
    timeRemaining = timeMatch[1];
  }

  return { percent, charging, timeRemaining };
}

function getProcessCount(): number {
  const output = safeExec("ps aux 2>/dev/null | wc -l");
  if (!output) {
    return 0;
  }
  const count = parseInt(output.trim(), 10);
  return isNaN(count) ? 0 : count - 1;
}

function parseVmStat(): { swapGB: number; compressedGB: number } {
  const output = safeExec("vm_stat 2>/dev/null");
  if (!output) {
    return { swapGB: 0, compressedGB: 0 };
  }

  const pageSize = 16384;

  let pagesOccupiedByCompressor = 0;
  let pagesStoredInCompressor = 0;

  const occupiedMatch = output.match(/Pages occupied by compressor:\s*(\d+)/);
  if (occupiedMatch) {
    pagesOccupiedByCompressor = parseInt(occupiedMatch[1], 10);
  }

  const storedMatch = output.match(/Pages stored in compressor:\s*(\d+)/);
  if (storedMatch) {
    pagesStoredInCompressor = parseInt(storedMatch[1], 10);
  }

  const compressedGB = (pagesStoredInCompressor * pageSize) / BYTES_PER_GB;
  const physicalCompressedGB = (pagesOccupiedByCompressor * pageSize) / BYTES_PER_GB;

  return { swapGB: physicalCompressedGB, compressedGB };
}

function computeNeuralScore(profile: SystemProfile): number {
  let score = 0;

  const ram = profile.memory.totalGB;
  if (ram >= 64) score += 40;
  else if (ram >= 32) score += 35;
  else if (ram >= 16) score += 25;
  else if (ram < 8) score += 5;
  else score += 15;

  const cores = profile.cpu.cores;
  if (cores >= 16) score += 20;
  else if (cores >= 10) score += 16;
  else if (cores >= 8) score += 14;
  else if (cores >= 4) score += 8;
  else score += 4;

  const metal = profile.gpu.metal;
  if (/Metal\s*4/i.test(metal)) score += 15;
  else if (/Metal\s*3/i.test(metal)) score += 10;
  else score += 3;

  const freeDisk = profile.disk.freeGB;
  if (freeDisk > 50) score += 10;
  else if (freeDisk > 20) score += 7;
  else if (freeDisk > 10) score += 4;
  else score += 1;

  if (profile.ollama.installed) score += 10;

  if (/apple/i.test(profile.cpu.model)) score += 5;

  return Math.min(100, score);
}

export async function getSystemProfile(): Promise<SystemProfile> {
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown";
  const cpuCores = cpus.length;
  const cpuSpeed = cpus.length > 0 ? `${cpus[0].speed} MHz` : "Unknown";
  const loadAvg = os.loadavg() as [number, number, number];

  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const totalGB = totalMemBytes / BYTES_PER_GB;
  const availableGB = freeMemBytes / BYTES_PER_GB;
  const usedGB = totalGB - availableGB;
  const usagePercent = totalGB > 0 ? (usedGB / totalGB) * 100 : 0;
  const vmStat = parseVmStat();

  const gpu = parseGPU();
  const disk = parseDisk();
  const ollama = detectOllama();
  const battery = parseBattery();
  const processes = getProcessCount();

  const profile: SystemProfile = {
    cpu: { model: cpuModel, cores: cpuCores, speed: cpuSpeed, loadAvg },
    memory: {
      totalGB,
      availableGB,
      usedGB,
      usagePercent,
      swapGB: vmStat.swapGB,
      compressedGB: vmStat.compressedGB,
    },
    gpu,
    disk,
    platform: {
      os: os.platform(),
      arch: os.arch(),
      kernel: os.release(),
      hostname: os.hostname(),
    },
    ollama,
    battery,
    processes,
    neuralScore: 0,
  };

  profile.neuralScore = computeNeuralScore(profile);

  return profile;
}

const TIER_ORDER: Record<string, number> = { slm: 0, mlm: 1, llm: 2 };

export function getModelRecommendations(profile: SystemProfile): ModelCandidate[] {
  const candidates: ModelCandidate[] = MODEL_DB.map((m) => {
    const fitsOnMachine = m.minRamGB <= Math.max(profile.memory.availableGB, profile.memory.totalGB * 0.5);
    const hardcoreMode = m.sizeGB <= profile.memory.totalGB * 0.85;

    return {
      ...m,
      fitsOnMachine,
      hardcoreMode,
      ollamaCommand: `ollama pull ${m.ollamaName}`,
    };
  });

  candidates.sort((a, b) => {
    if (a.fitsOnMachine !== b.fitsOnMachine) {
      return a.fitsOnMachine ? -1 : 1;
    }
    const tierA = TIER_ORDER[a.tier] ?? 99;
    const tierB = TIER_ORDER[b.tier] ?? 99;
    if (tierA !== tierB) {
      return tierA - tierB;
    }
    return a.sizeGB - b.sizeGB;
  });

  return candidates;
}

export function getBestModel(profile: SystemProfile): ModelCandidate {
  const candidates = getModelRecommendations(profile);
  const fitting = candidates.filter((c) => c.fitsOnMachine);

  if (fitting.length === 0) {
    throw new Error(
      "No models fit within available RAM. Consider freeing memory or use getHardcoreBestModel()."
    );
  }

  const codingModels = fitting.filter((c) => c.specialty === "Coding");
  const pool = codingModels.length > 0 ? codingModels : fitting;

  const preferred = pool.find(c => c.name === "Qwen2.5-Coder");
  if (preferred) return preferred;
  return pool[0];
}

export function getHardcoreBestModel(profile: SystemProfile): ModelCandidate {
  const candidates = getModelRecommendations(profile);
  const hardcore = candidates.filter((c) => c.hardcoreMode);

  if (hardcore.length === 0) {
    throw new Error(
      "No models fit even in hardcore mode. Your system has insufficient RAM for any listed model."
    );
  }

  const codingModels = hardcore.filter((c) => c.specialty === "Coding");
  const pool = codingModels.length > 0 ? codingModels : hardcore;

  return pool[pool.length - 1];
}

export async function installModel(ollamaName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      execSync(`ollama pull ${ollamaName}`, {
        encoding: "utf-8",
        stdio: "inherit",
        timeout: 600000,
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
