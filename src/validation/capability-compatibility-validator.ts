import { CapabilitySet, CapabilityName, CompatibilityReport } from "./types";

export class CapabilityCompatibilityValidator {
  validateCompatibility(required: CapabilitySet, provided: CapabilitySet): CompatibilityReport {
    const missingCapabilities: CapabilityName[] = [];
    const conflictingCapabilities: CapabilityName[] = [];

    // 1. Check for missing required capabilities
    for (const requiredCap of required) {
      if (!provided.has(requiredCap)) {
        missingCapabilities.push(requiredCap);
      }
    }

    // 2. Check for conflicting capabilities
    // Conflict detection logic: Assume a conflict exists if a capability is provided
    // but is explicitly marked as incompatible or if the provided set contains
    // capabilities that are known to conflict with the required set (simplified check).
    // For this implementation, we'll assume a conflict occurs if a provided capability
    // is not explicitly required AND is marked as 'conflicting' in the provided set structure.
    // Since the input CapabilitySet is just a set of names, we'll simulate conflict detection
    // by checking for a predefined conflict list (or assuming any provided capability
    // that is not strictly necessary might be a potential conflict if the system
    // enforces strict minimalism).

    // Simplified conflict check: If the provided set contains capabilities that are
    // known to conflict with the *overall* goal (represented by the required set).
    // For robust simulation, we assume a conflict if a provided capability is not
    // in the required set AND is known to be problematic.
    // Since we don't have external conflict definitions, we'll assume a conflict
    // if the provided set is significantly larger than the required set, indicating
    // potential over-provisioning or incompatible features.

    const providedNames = Array.from(provided.values());
    const requiredNames = Array.from(required.values());

    const potentialConflicts = providedNames.filter(
      (cap) => !requiredNames.includes(cap) && cap !== "core_context_awareness"
    );

    // In a real system, this would check against a CapabilityGraph.
    // Here, we just report any extra capability as a potential conflict for safety.
    if (potentialConflicts.length > 0) {
      conflictingCapabilities.push(...potentialConflicts);
    }

    const isCompatible = missingCapabilities.length === 0 && conflictingCapabilities.length === 0;

    return {
      isCompatible,
      missingCapabilities,
      conflictingCapabilities,
      message: isCompatible
        ? "Compatibility check passed. All required capabilities are available and compatible."
        : `Compatibility check failed. Missing: ${missingCapabilities.length} capabilities. Conflicts: ${conflictingCapabilities.length} capabilities.`,
    };
  }
}