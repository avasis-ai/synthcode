import {
  ToolResultMessage,
  Message,
} from "./types";

export type SchemaEvolutionMismatchError = Error & {
  name: "SchemaEvolutionMismatch";
  expectedVersion: string;
  actualVersion: string;
};

interface SchemaValidatorOptions {
  initialSchemaVersion: string;
  schemaVersions: Record<string, (schema: any) => boolean>;
}

export class StructuredToolOutputSchemaValidatorV1026 {
  private currentSchemaVersion: string;
  private options: SchemaValidatorOptions;

  constructor(options: SchemaValidatorOptions) {
    this.options = options;
    this.currentSchemaVersion = options.initialSchemaVersion;
  }

  private validateSchema(schema: any, version: string): boolean {
    const validator = this.options.schemaVersions[version];
    if (!validator) {
      throw new Error(`No validator found for schema version: ${version}`);
    }
    return validator(schema);
  }

  public validate(
    toolOutput: ToolResultMessage,
    incomingSchemaVersion: string
  ): {
    isValid: boolean;
    nextVersion: string | null;
  } | SchemaEvolutionMismatchError {
    if (incomingSchemaVersion === this.currentSchemaVersion) {
      if (!this.validateSchema(toolOutput, incomingSchemaVersion)) {
        return {
          isValid: false,
          nextVersion: null,
        };
      }
      return {
        isValid: true,
        nextVersion: null,
      };
    }

    if (incomingSchemaVersion !== this.currentSchemaVersion) {
      const error: SchemaEvolutionMismatchError = new Error(
        `Schema evolution mismatch. Expected version ${this.currentSchemaVersion}, but received ${incomingSchemaVersion}.`
      ) as SchemaEvolutionMismatchError;
      error.expectedVersion = this.currentSchemaVersion;
      error.actualVersion = incomingSchemaVersion;
      return error;
    }

    // This path should ideally not be reached if logic is sound, but handles unexpected state.
    return {
      isValid: false,
      nextVersion: null,
    };
  }

  public advanceSchemaVersion(newVersion: string): {
    isValid: boolean;
    nextVersion: string | null;
  } | SchemaEvolutionMismatchError {
    if (newVersion === this.currentSchemaVersion) {
      return {
        isValid: true,
        nextVersion: null,
      };
    }

    const error: SchemaEvolutionMismatchError = new Error(
      `Cannot advance schema. Current version ${this.currentSchemaVersion} is not ready to advance to ${newVersion}.`
    ) as SchemaEvolutionMismatchError;
    error.expectedVersion = this.currentSchemaVersion;
    error.actualVersion = newVersion;
    return error;
  }

  public updateState(newVersion: string): void {
    this.currentSchemaVersion = newVersion;
  }
}