import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ProfileKey = "Debug" | "Production" | "LowCost" | "HighFidelity";

interface Profile {
  contextWindowSize: number;
  validationStrictness: "loose" | "moderate" | "strict";
  loggingLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
  costSensitivity: number;
  maxTokensPerTurn: number;
}

export class BehavioralProfileManager {
  private profiles: Map<ProfileKey, Profile>;
  private activeProfile: Profile | null = null;

  constructor() {
    this.profiles = new Map();
    this.initializeDefaultProfiles();
  }

  private initializeDefaultProfiles(): void {
    this.profiles.set("Debug", {
      contextWindowSize: 8192,
      validationStrictness: "loose",
      loggingLevel: "DEBUG",
      costSensitivity: 0.1,
      maxTokensPerTurn: 4096,
    });
    this.profiles.set("Production", {
      contextWindowSize: 4000,
      validationStrictness: "moderate",
      loggingLevel: "INFO",
      costSensitivity: 0.8,
      maxTokensPerTurn: 2048,
    });
    this.profiles.set("LowCost", {
      contextWindowSize: 2048,
      validationStrictness: "loose",
      loggingLevel: "WARN",
      costSensitivity: 0.95,
      maxTokensPerTurn: 1024,
    });
    this.profiles.set("HighFidelity", {
      contextWindowSize: 8192,
      validationStrictness: "strict",
      loggingLevel: "DEBUG",
      costSensitivity: 0.2,
      maxTokensPerTurn: 4096,
    });
  }

  public getActiveProfile(): Profile | null {
    return this.activeProfile;
  }

  public loadProfile(key: ProfileKey): void {
    const profile = this.profiles.get(key);
    if (profile) {
      this.activeProfile = profile;
    } else {
      throw new Error(`Profile ${key} not found.`);
    }
  }

  public switchProfile(key: ProfileKey): void {
    this.loadProfile(key);
  }

  public getProfileDetails(key: ProfileKey): Profile {
    const profile = this.profiles.get(key);
    if (!profile) {
      throw new Error(`Profile ${key} does not exist.`);
    }
    return profile;
  }

  public applyProfileHooks(
    context: {
      contextWindowSize: number;
      payload: Record<string, unknown>;
    },
    hookName: "contextEnrichment" | "validation" | "costEstimation"
  ): {
    context: {
      contextWindowSize: number;
      payload: Record<string, unknown>;
    };
    modified: boolean;
  } {
    if (!this.activeProfile) {
      return { context, modified: false };
    }

    const profile = this.activeProfile;
    let modified = false;
    let newContext = { ...context };

    switch (hookName) {
      case "contextEnrichment":
        if (profile.contextWindowSize < context.contextWindowSize) {
          newContext.contextWindowSize = profile.contextWindowSize;
          modified = true;
        }
        if (profile.loggingLevel === "DEBUG") {
          newContext.payload = { ...newContext.payload, debugMode: true };
          modified = true;
        }
        break;

      case "validation":
        if (profile.validationStrictness === "loose") {
          newContext.payload = { ...newContext.payload, validationLevel: "loose" };
          modified = true;
        }
        break;

      case "costEstimation":
        if (profile.costSensitivity > 0.8) {
          newContext.payload = { ...newContext.payload, costOptimization: true };
          modified = true;
        }
        break;
    }

    return { context: newContext, modified };
  }
}