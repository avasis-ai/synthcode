import { Capability, CapabilityRegistry, DesiredCapability, CompatibilityPlan, Conflict } from "./types";

class CapabilityCompatibilityPlanner {
    private desiredCapabilities: DesiredCapability[];
    private registry: CapabilityRegistry;

    constructor(desiredCapabilities: DesiredCapability[], registry: CapabilityRegistry) {
        this.desiredCapabilities = desiredCapabilities;
        this.registry = registry;
    }

    private resolveVersionConflict(
        capabilityId: string,
        desired: DesiredCapability,
        available: Capability[]
    ): { resolvedVersion: string; conflict?: Conflict } {
        const compatibleVersions = available.filter(c =>
            this.isVersionCompatible(c.version, desired.minVersion, desired.maxVersion)
        );

        if (compatibleVersions.length === 0) {
            return { resolvedVersion: "", conflict: { id: capabilityId, message: `No compatible version found for ${capabilityId} within range ${desired.minVersion} to ${desired.maxVersion}.` } };
        }

        // Strategy: Pick the highest available version
        compatibleVersions.sort((a, b) => {
            const versionA = this.parseVersion(a.version);
            const versionB = this.parseVersion(b.version);
            return versionB - versionA;
        });

        const resolved = compatibleVersions[0];
        return { resolvedVersion: resolved.version, conflict: undefined };
    }

    private isVersionCompatible(version: string, min: string, max: string): boolean {
        // Simplified semantic version comparison (assuming major.minor.patch format)
        const compare = (v1: string, v2: string): number => {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const p1 = parts1[i] || 0;
                const p2 = parts2[i] || 0;
                if (p1 !== p2) {
                    return p1 - p2;
                }
            }
            return 0;
        };

        const minCheck = compare(version, min);
        const maxCheck = compare(version, max);

        return minCheck >= 0 && maxCheck <= 0;
    }

    private parseVersion(version: string): number {
        // Simple heuristic for version comparison (e.g., 1.2.3 -> 123)
        return version.split('.').reduce((acc, part) => acc * 1000 + parseInt(part || '0'), 0);
    }

    public planCompatibility(): CompatibilityPlan {
        const resolvedCapabilities: Record<string, Capability> = {};
        const conflicts: Conflict[] = [];
        const remediationSteps: string[] = [];

        // Phase 1: Resolve individual capability versions
        for (const desired of this.desiredCapabilities) {
            const available = this.registry.getAvailableCapabilities(desired.id);
            const { resolvedVersion, conflict } = this.resolveVersionConflict(desired.id, desired, available);

            if (conflict) {
                conflicts.push(conflict);
                remediationSteps.push(`[ERROR] Cannot satisfy ${desired.id}: ${conflict.message}`);
                continue;
            }

            const resolvedCapability = available.find(c => c.version === resolvedVersion);
            if (resolvedCapability) {
                resolvedCapabilities[desired.id] = resolvedCapability;
            }
        }

        // Phase 2: Check for cross-capability conflicts (Simplified: checking for duplicate IDs)
        // In a real system, this would involve analyzing side effects/dependencies.
        const finalConflicts: Conflict[] = [];
        if (Object.keys(resolvedCapabilities).length !== new Set(this.desiredCapabilities.map(d => d.id)).size) {
             finalConflicts.push({
                id: "System",
                message: "Internal conflict detected: Some desired capabilities could not be resolved.",
            });
        }

        // Phase 3: Generate Plan
        const plan: CompatibilityPlan = {
            resolvedCapabilities: resolvedCapabilities,
            conflicts: [...conflicts, ...finalConflicts],
            remediationSteps: remediationSteps.length > 0 ? remediationSteps : ["All capabilities appear compatible based on current constraints."],
        };

        return plan;
    }
}

export { CapabilityCompatibilityPlanner };