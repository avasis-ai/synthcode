import { Message, ToolResultMessage } from "./types";

type SchemaVersion = {
  major: number;
  minor: number;
  patch: number;
};

export class ToolOutputSchemaVersionController {
  private targetVersion: SchemaVersion;

  constructor(targetVersion: SchemaVersion) {
    this.targetVersion = targetVersion;
  }

  private compareVersions(v1: SchemaVersion, v2: SchemaVersion): number {
    if (v1.major !== v2.major) return v1.major > v2.major ? 1 : -1;
    if (v1.minor !== v2.minor) return v1.minor > v2.minor ? 1 : -1;
    if (v1.patch !== v2.patch) return v1.patch > v2.patch ? 1 : -1;
    return 0;
  }

  private isCompatible(receivedVersion: SchemaVersion): boolean {
    const comparison = this.compareVersions(receivedVersion, this.targetVersion);
    if (comparison < 0) {
      return false; // Received version is older than target
    }
    if (comparison > 0) {
      return false; // Received version is newer than target (potential breaking change)
    }
    return true; // Versions match
  }

  private isMinorCompatible(receivedVersion: SchemaVersion): boolean {
    const comparison = this.compareVersions(receivedVersion, this.targetVersion);
    if (comparison < 0) {
      return false; // Too old
    }
    if (comparison > 0) {
      // Check if only minor or patch increased, but major is the same
      if (receivedVersion.major !== this.targetVersion.major) {
        return false;
      }
      return true; // Minor or patch increase is acceptable
    }
    return true; // Exact match
  }

  /**
   * Validates the received schema version against the target version.
   * @param receivedVersion The version reported by the tool.
   * @throws Error if the mismatch is critical (Major version mismatch or significant downgrade).
   * @returns boolean indicating compatibility status.
   */
  validate(receivedVersion: SchemaVersion): boolean {
    if (this.compareVersions(receivedVersion, this.targetVersion) > 0) {
      throw new Error(
        `Schema version mismatch: Received ${receivedVersion.major}.${receivedVersion.minor}.${receivedVersion.patch}, expected ${this.targetVersion.major}.${this.targetVersion.minor}.${this.targetVersion.patch}. Received version is newer, which might contain breaking changes.`
      );
    }

    if (this.compareVersions(receivedVersion, this.targetVersion) < 0) {
      if (receivedVersion.major < this.targetVersion.major) {
        throw new Error(
          `Schema version mismatch: Received ${receivedVersion.major}.${receivedVersion.minor}.${receivedVersion.patch}, expected ${this.targetVersion.major}.${this.targetVersion.minor}.${this.targetVersion.patch}. Received version is significantly older, potential data loss.`
        );
      }
      // Check for minor/patch downgrade (e.g., 1.2.0 -> 1.1.5)
      if (receivedVersion.major === this.targetVersion.major && receivedVersion.minor < this.targetVersion.minor) {
        console.warn(
          `[Warning] Schema version downgrade detected: Received ${receivedVersion.major}.${receivedVersion.minor}.${receivedVersion.patch}, expected ${this.targetVersion.major}.${this.targetVersion.minor}.${this.targetVersion.patch}. Proceeding with caution.`
        );
        return true; // Controlled fallback/warning
      }
    }

    if (this.compareVersions(receivedVersion, this.targetVersion) === 0) {
      return true; // Perfect match
    }

    // If we reach here, it's likely a minor/patch increase that is acceptable
    if (this.isMinorCompatible(receivedVersion)) {
      console.warn(
        `[Warning] Schema version minor/patch update detected: Received ${receivedVersion.major}.${receivedVersion.minor}.${receivedVersion.patch}, expected ${this.targetVersion.major}.${this.targetVersion.minor}.${this.targetVersion.patch}. Assuming backward compatibility.`
      );
      return true;
    }

    return true; // Default safe return if no critical error was thrown
  }

  /**
   * Performs a full validation check.
   * @param receivedVersion The version reported by the tool.
   * @returns {boolean} True if validation passes or warnings were issued.
   * @throws {Error} If the version mismatch is critical.
   */
  checkCompatibility(receivedVersion: SchemaVersion): boolean {
    return this.validate(receivedVersion);
  }
}