import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type SchemaCompatibility = "additive" | "backward";

export interface SchemaVersion {
  version: string;
  schema: Record<string, any>;
  compatibility: SchemaCompatibility;
}

export class SchemaVersionMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaVersionMismatchError";
  }
}

export class VersionCompatibilityResolver {
  private registeredVersions: Map<string, SchemaVersion> = new Map();

  registerVersion(version: SchemaVersion): void {
    if (this.registeredVersions.has(version.version)) {
      throw new Error(`Schema version ${version.version} is already registered.`);
    }
    this.registeredVersions.set(version.version, version);
  }

  getSchema(version: string): SchemaVersion | undefined {
    return this.registeredVersions.get(version);
  }

  resolve(
    currentVersion: string,
    targetVersion: string
  ): { compatibleSchema: Record<string, any>; resolvedVersion: string } | { error: Error } {
    const currentSchema = this.getSchema(currentVersion);
    const targetSchema = this.getSchema(targetVersion);

    if (!currentSchema) {
      return { error: new Error(`Current schema version ${currentVersion} not found.`) };
    }
    if (!targetSchema) {
      return { error: new Error(`Target schema version ${targetVersion} not found.`) };
    }

    if (currentSchema.version === targetSchema.version) {
      return { compatibleSchema: currentSchema.schema, resolvedVersion: targetSchema.version };
    }

    if (currentSchema.compatibility === "additive" && targetSchema.compatibility === "additive") {
      // Simple additive merge for demonstration
      const mergedSchema: Record<string, any> = { ...currentSchema.schema, ...targetSchema.schema };
      return { compatibleSchema: mergedSchema, resolvedVersion: targetSchema.version };
    }

    if (currentSchema.compatibility === "backward" && targetSchema.compatibility === "backward") {
      // In a real scenario, this would involve complex structural merging logic.
      // For this example, we assume backward compatibility means the target schema is acceptable.
      return { compatibleSchema: targetSchema.schema, resolvedVersion: targetSchema.version };
    }

    return { error: new Error(
      `Cannot resolve compatibility from ${currentSchema.version} to ${targetSchema.version}. Compatibility rules conflict.`
    )};
  }
}

export class SchemaVersionController {
  private resolver: VersionCompatibilityResolver;

  constructor() {
    this.resolver = new VersionCompatibilityResolver();
  }

  registerSchema(version: SchemaVersion): void {
    this.resolver.registerVersion(version);
  }

  validateAndResolve(
    currentVersion: string,
    targetVersion: string,
    incomingSchema: Record<string, any>
  ): Record<string, any> {
    const resolution = this.resolver.resolve(currentVersion, targetVersion);

    if ("error" in resolution) {
      throw new SchemaVersionMismatchError(
        `Schema validation failed: ${resolution.error.message}`
      );
    }

    const { compatibleSchema, resolvedVersion } = resolution;

    // In a real system, we would now validate incomingSchema against compatibleSchema.
    // For this implementation, we return the compatible schema as the result of successful resolution.
    if (Object.keys(incomingSchema).length > 0) {
        // Simulate enrichment/validation: merge incoming with the resolved structure
        return { ...compatibleSchema, ...incomingSchema };
    }

    return compatibleSchema;
  }
}

export { SchemaVersionController, SchemaVersionMismatchError };