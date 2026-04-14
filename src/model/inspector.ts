import * as os from "os";
import { execSync } from "child_process";

export interface GPUInfo {
  name: string;
  vramGB: number;
  type: "nvidia" | "amd" | "apple-silicon" | "intel";
}

export interface ProviderAvailability {
  name: string;
  available: boolean;
  version?: string;
  endpoint?: string;
  installedModels?: number;
}

export interface InstalledModel {
  name: string;
  tag: string;
  provider: string;
  sizeGB: number;
  quantization?: string;
}

export interface MachineProfile {
  hostname: string;
  platform: string;
  arch: string;
  cpuCores: number;
  cpuModel: string;
  totalRamGB: number;
  availableRamGB: number;
  gpus: GPUInfo[];
  hasMetal: boolean;
  providers: ProviderAvailability[];
  installedModels: InstalledModel[];
  scannedAt: number;
}

type HardwareInfo = Pick<
  MachineProfile,
  | "hostname"
  | "platform"
  | "arch"
  | "cpuCores"
  | "cpuModel"
  | "totalRamGB"
  | "availableRamGB"
  | "gpus"
  | "hasMetal"
>;

const GB = 1024 * 1024 * 1024;

function safeExecSync(command: string): string | null {
  try {
    return execSync(command, {
      encoding: "utf-8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    })
      .trim();
  } catch {
    return null;
  }
}

export class MachineInspector {
  private cachedProfile: MachineProfile | null = null;

  async inspect(): Promise<MachineProfile> {
    const hardware = await this.detectHardware();
    const providers = await this.detectProviders();
    const installedModels = await this.detectInstalledModels();

    this.cachedProfile = {
      ...hardware,
      providers,
      installedModels,
      scannedAt: Date.now(),
    };

    return this.cachedProfile;
  }

  async detectHardware(): Promise<HardwareInfo> {
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : "unknown";
    const isAppleSilicon = cpuModel.toLowerCase().includes("apple");

    const gpus: GPUInfo[] = [];

    if (isAppleSilicon) {
      gpus.push({
        name: cpuModel,
        vramGB: parseFloat((os.totalmem() / GB).toFixed(2)),
        type: "apple-silicon",
      });
    }

    const nvidiaGpus = this.detectNvidiaGPUs();
    if (nvidiaGpus) {
      gpus.push(...nvidiaGpus);
    }

    const amdGpus = this.detectAmdGPUs();
    if (amdGpus) {
      gpus.push(...amdGpus);
    }

    const intelGpus = this.detectIntelGPUs();
    if (intelGpus) {
      gpus.push(...intelGpus);
    }

    return {
      hostname: os.hostname(),
      platform: os.platform() as MachineProfile["platform"],
      arch: os.arch() as MachineProfile["arch"],
      cpuCores: cpus.length,
      cpuModel,
      totalRamGB: parseFloat((os.totalmem() / GB).toFixed(2)),
      availableRamGB: parseFloat((os.freemem() / GB).toFixed(2)),
      gpus,
      hasMetal: isAppleSilicon,
    };
  }

  private detectNvidiaGPUs(): GPUInfo[] | null {
    const output = safeExecSync(
      'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits'
    );
    if (!output) return null;

    const gpus: GPUInfo[] = [];
    const lines = output.split("\n").filter((l) => l.trim().length > 0);

    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length < 2) continue;
      const name = parts[0];
      const vramMiB = parseFloat(parts[1]);
      if (isNaN(vramMiB)) continue;
      gpus.push({
        name,
        vramGB: parseFloat((vramMiB / 1024).toFixed(2)),
        type: "nvidia",
      });
    }

    return gpus.length > 0 ? gpus : null;
  }

  private detectAmdGPUs(): GPUInfo[] | null {
    const output = safeExecSync(
      "rocm-smi --showproductname --csv"
    );
    if (!output) return null;

    const gpus: GPUInfo[] = [];
    const lines = output.split("\n").filter((l) => l.trim().length > 0);

    for (const line of lines.slice(1)) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length < 2) continue;
      const name = parts[1] || parts[0];
      gpus.push({
        name,
        vramGB: 0,
        type: "amd",
      });
    }

    const vramOutput = safeExecSync(
      "rocm-smi --showmeminfo vram --csv"
    );
    if (vramOutput && gpus.length > 0) {
      const vramLines = vramOutput.split("\n").filter((l) => l.trim().length > 0);
      let gpuIndex = 0;
      for (const vramLine of vramLines.slice(1)) {
        const vramParts = vramLine.split(",").map((s) => s.trim());
        if (vramParts.length >= 2) {
          const totalBytes = parseInt(vramParts[1], 10);
          if (!isNaN(totalBytes) && gpuIndex < gpus.length) {
            gpus[gpuIndex].vramGB = parseFloat((totalBytes / GB).toFixed(2));
            gpuIndex++;
          }
        }
      }
    }

    return gpus.length > 0 ? gpus : null;
  }

  private detectIntelGPUs(): GPUInfo[] | null {
    if (os.platform() !== "linux") return null;

    const output = safeExecSync("lspci -nn 2>/dev/null | grep -i vga");
    if (!output) return null;

    const gpus: GPUInfo[] = [];
    const lines = output.split("\n").filter((l) => l.trim().length > 0);

    for (const line of lines) {
      if (line.toLowerCase().includes("intel")) {
        const match = line.match(/:\s*(.+)/);
        const name = match ? match[1].trim() : "Intel GPU";
        gpus.push({
          name,
          vramGB: 0,
          type: "intel",
        });
      }
    }

    return gpus.length > 0 ? gpus : null;
  }

  async detectProviders(): Promise<ProviderAvailability[]> {
    const providers: ProviderAvailability[] = [];

    providers.push(await this.detectOllama());
    providers.push(await this.detectLmStudio());
    providers.push(await this.detectLlamacpp());
    providers.push(await this.detectAnthropic());
    providers.push(await this.detectOpenAI());

    return providers;
  }

  private async detectOllama(): Promise<ProviderAvailability> {
    const versionOutput = safeExecSync("ollama --version");
    let version: string | undefined;
    if (versionOutput) {
      const match = versionOutput.match(/[\d.]+/);
      version = match ? match[0] : undefined;
    }

    const isInstalled = versionOutput !== null;

    let installedModels: number | undefined;
    if (isInstalled) {
      const models = await this.fetchOllamaModels();
      installedModels = models.length;
    }

    return {
      name: "ollama",
      available: isInstalled,
      version,
      endpoint: "http://localhost:11434",
      installedModels,
    };
  }

  private async detectLmStudio(): Promise<ProviderAvailability> {
    let version: string | undefined;
    const lmsOutput = safeExecSync("lms version 2>/dev/null || lmstudio --version 2>/dev/null");
    if (lmsOutput) {
      const match = lmsOutput.match(/[\d.]+/);
      version = match ? match[0] : undefined;
    }

    const serverCheck = safeExecSync("curl -s -o /dev/null -w '%{http_code}' http://localhost:1234/v1/models");
    const isRunning = serverCheck !== null && serverCheck.includes("200");

    let installedModels: number | undefined;
    if (isRunning) {
      const models = await this.fetchLmStudioModels();
      installedModels = models.length;
    }

    return {
      name: "lmstudio",
      available: isRunning || lmsOutput !== null,
      version,
      endpoint: "http://localhost:1234",
      installedModels,
    };
  }

  private async detectLlamacpp(): Promise<ProviderAvailability> {
    const output = safeExecSync("which llama-cli 2>/dev/null || which main 2>/dev/null || which llama.cpp 2>/dev/null");
    return {
      name: "llamacpp",
      available: output !== null,
    };
  }

  private async detectAnthropic(): Promise<ProviderAvailability> {
    const hasApiKey = !!(
      process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0
    );

    const cliOutput = safeExecSync("claude --version 2>/dev/null");
    let version: string | undefined;
    if (cliOutput) {
      const match = cliOutput.match(/[\d.]+/);
      version = match ? match[0] : undefined;
    }

    return {
      name: "anthropic",
      available: hasApiKey || cliOutput !== null,
      version,
      endpoint: "https://api.anthropic.com",
    };
  }

  private async detectOpenAI(): Promise<ProviderAvailability> {
    const hasApiKey = !!(
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
    );

    const cliOutput = safeExecSync("openai --version 2>/dev/null");
    let version: string | undefined;
    if (cliOutput) {
      const match = cliOutput.match(/[\d.]+/);
      version = match ? match[0] : undefined;
    }

    return {
      name: "openai",
      available: hasApiKey || cliOutput !== null,
      version,
      endpoint: "https://api.openai.com",
    };
  }

  async detectInstalledModels(): Promise<InstalledModel[]> {
    const models: InstalledModel[] = [];

    const ollamaModels = await this.fetchOllamaModels();
    models.push(...ollamaModels);

    const lmStudioModels = await this.fetchLmStudioModels();
    models.push(...lmStudioModels);

    return models;
  }

  private async fetchOllamaModels(): Promise<InstalledModel[]> {
    const output = safeExecSync("curl -s http://localhost:11434/api/tags");
    if (!output) return [];

    try {
      const parsed = JSON.parse(output);
      const models: InstalledModel[] = [];

      if (parsed && Array.isArray(parsed.models)) {
        for (const model of parsed.models) {
          const name: string = model.name || model.model || "unknown";
          const sizeBytes: number = model.size || 0;
          const quant: string | undefined = model.details?.quantization_level;

          models.push({
            name,
            tag: name,
            provider: "ollama",
            sizeGB: parseFloat((sizeBytes / GB).toFixed(2)),
            quantization: quant,
          });
        }
      }

      return models;
    } catch {
      return [];
    }
  }

  private async fetchLmStudioModels(): Promise<InstalledModel[]> {
    const output = safeExecSync("curl -s http://localhost:1234/v1/models");
    if (!output) return [];

    try {
      const parsed = JSON.parse(output);
      const models: InstalledModel[] = [];

      if (parsed && Array.isArray(parsed.data)) {
        for (const model of parsed.data) {
          const name: string = model.id || "unknown";

          models.push({
            name,
            tag: name,
            provider: "lmstudio",
            sizeGB: 0,
          });
        }
      }

      return models;
    } catch {
      return [];
    }
  }

  getEffectiveVramGB(): number {
    if (!this.cachedProfile) return 0;

    const appleSilicon = this.cachedProfile.gpus.find(
      (g) => g.type === "apple-silicon"
    );
    if (appleSilicon) {
      return this.cachedProfile.totalRamGB;
    }

    return this.cachedProfile.gpus.reduce((sum, gpu) => sum + gpu.vramGB, 0);
  }

  getEffectiveRamGB(): number {
    if (!this.cachedProfile) return 0;
    return this.cachedProfile.availableRamGB;
  }

  canRunModel(minVramGB: number, minRamGB: number): boolean {
    return this.getEffectiveVramGB() >= minVramGB && this.getEffectiveRamGB() >= minRamGB;
  }

  toJSON(): string {
    const profile = this.cachedProfile;
    if (!profile) {
      return JSON.stringify({ error: "no profile; call inspect() first" });
    }
    return JSON.stringify(profile, null, 2);
  }
}
