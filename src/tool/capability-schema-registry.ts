import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export interface CapabilitySchema {
  schema: Record<string, unknown>;
  version: string;
  description: string;
}

export interface SchemaKey {
  name: string;
  version: string;
}

export class CapabilityRegistry {
  private schemas: Map<string, Map<string, CapabilitySchema>>;

  constructor() {
    this.schemas = new Map();
  }

  registerSchema(name: string, schema: Record<string, unknown>, version: string, description: string): void {
    if (!this.schemas.has(name)) {
      this.schemas.set(name, new Map());
    }
    const nameMap = this.schemas.get(name)!;
    nameMap.set(version, {
      schema: schema,
      version: version,
      description: description,
    });
  }

  getSchema(name: string, version: string): CapabilitySchema | undefined {
    if (!this.schemas.has(name)) {
      return undefined;
    }
    const nameMap = this.schemas.get(name)!;
    return nameMap.get(version);
  }

  getLatestSchema(name: string): CapabilitySchema | undefined {
    if (!this.schemas.has(name)) {
      return undefined;
    }

    const nameMap = this.schemas.get(name)!;
    let latestVersion: string = "";
    let latestSchema: CapabilitySchema | undefined = undefined;

    for (const [version, schema] of nameMap.entries()) {
      if (version > latestVersion) {
        latestVersion = version;
        latestSchema = schema;
      }
    }
    return latestSchema;
  }

  hasSchema(name: string, version: string): boolean {
    return this.schemas.has(name) && this.schemas.get(name)!.has(version);
  }

  listAvailableSchemas(name: string): Map<string, CapabilitySchema> | undefined {
    if (!this.schemas.has(name)) {
      return undefined;
    }
    return this.schemas.get(name)!;
  }
}

export const capabilitySchemaRegistry = new CapabilityRegistry();