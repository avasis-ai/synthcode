import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type Version = {
  major: number;
  minor: number;
  patch: number;
};

export interface CompatibilityReport {
  isCompatible: boolean;
  message: string;
  requiredAdapters: Record<string, Adapter>;
}

export interface Adapter {
  // Maps input parameters from the expected version signature to the available version signature
  getInputMapper: (input: Record<string, unknown>) => Record<string, unknown>;
  // Maps output results from the available version signature to the expected version signature
  getOutputMapper: (output: Record<string, unknown>) => Record<string, unknown>;
}

export class ToolVersion {
  constructor(public name: string, public version: Version, public compatibilityMap: Record<string, { min: Version; max: Version }>) {}

  isCompatible(expected: Version, available: Version): boolean {
    const key = `${this.name}:${this.version.major}.${this.version.minor}.${this.version.patch}`;
    const compatibility = this.compatibilityMap[key];

    if (!compatibility) {
      return false;
    }

    const checkVersion = (v: Version, target: Version): boolean => {
      if (v.major < target.major) return false;
      if (v.major > target.major) return false;
      if (v.minor < target.minor) return false;
      if (v.minor > target.minor) return false;
      if (v.patch < target.patch) return false;
      return true;
    };

    const checkMin = (v: Version, min: Version): boolean => {
      if (v.major < min.major) return false;
      if (v.major > min.major) return true;
      if (v.minor < min.minor) return false;
      if (v.minor > min.minor) return true;
      if (v.patch < min.patch) return false;
      return true;
    };

    const checkMax = (v: Version, max: Version): boolean => {
      if (v.major > max.major) return false;
      if (v.major < max.major) return true;
      if (v.minor > max.minor) return false;
      if (v.minor < max.minor) return true;
      if (v.patch > max.patch) return false;
      return true;
    };

    return checkMin(available, compatibility.min) && checkMax(available, compatibility.max);
  }
}

export class ToolVersionResolver {
  private availableTools: Map<string, ToolVersion>;

  constructor(availableTools: ToolVersion[]) {
    this.availableTools = new Map();
    availableTools.forEach(tool => {
      this.availableTools.set(tool.name, tool);
    });
  }

  private compareVersions(v1: Version, v2: Version): number {
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    return v1.patch - v2.patch;
  }

  resolve(expectedName: string, expectedVersion: Version, availableName: string, availableVersion: Version): CompatibilityReport {
    const expectedTool = this.availableTools.get(expectedName);
    const availableTool = this.availableTools.get(availableName);

    if (!expectedTool || !availableTool) {
      return { isCompatible: false, message: "One or both tools not found.", requiredAdapters: {} };
    }

    const isCompatible = expectedTool.isCompatible(expectedVersion, availableVersion);

    if (isCompatible) {
      return { isCompatible: true, message: "Versions are compatible.", requiredAdapters: {} };
    }

    const adapters: Record<string, Adapter> = {};
    
    // Placeholder logic for generating adapters based on version mismatch
    if (expectedVersion.major !== availableVersion.major) {
        adapters["major_version_mismatch"] = {
            getInputMapper: (input: Record<string, unknown>) => ({
                ...input,
                // Example: Renaming 'user_id' to 'userIdentifier'
                userIdentifier: input['user_id'] ?? input['userIdentifier']
            }),
            getOutputMapper: (output: Record<string, unknown>) => ({
                ...output,
                // Example: Flattening output structure
                result: output['final_result'] ?? output['result']
            })
        };
    }

    return {
      isCompatible: false,
      message: `Version mismatch detected. Expected ${expectedVersion.major}.${expectedVersion.minor}.${expectedVersion.patch}, but found ${availableVersion.major}.${availableVersion.minor}.${availableVersion.patch}.`,
      requiredAdapters: adapters
    };
  }

  getAdapter(expectedName: string, expectedVersion: Version, availableName: string, availableVersion: Version): Adapter | null {
    const report = this.resolve(expectedName, expectedVersion, availableName, availableVersion);

    if (report.requiredAdapters && Object.keys(report.requiredAdapters).length > 0) {
      // In a real scenario, we would select the most appropriate adapter.
      // Here we return the first found adapter for demonstration.
      const adapterKey = Object.keys(report.requiredAdapters)[0];
      return report.requiredAdapters[adapterKey];
    }

    return null;
  }
}