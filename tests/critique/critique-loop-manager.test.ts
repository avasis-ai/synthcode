import { describe, it, expect, vi } from "vitest";
import { CritiqueLoopManager } from "../src/critique/critique-loop-manager";

describe("CritiqueLoopManager", () => {
  it("should initialize correctly with default state", () => {
    const manager = new CritiqueLoopManager();
    expect(manager.isCritiqueActive).toBe(false);
    expect(manager.currentContext).toBeNull();
  });

  it("should activate critique mode and set initial context", () => {
    const manager = new CritiqueLoopManager();
    const initialContext: CritiqueContext = {
      isCritiqueActive: true,
      severity: "major",
      violationSummary: "Missing required component",
      requiredActions: ["Add component", "Review documentation"],
      contextMessage: "Please address the major violation.",
    };
    manager.activateCritique(initialContext);
    expect(manager.isCritiqueActive).toBe(true);
    expect(manager.currentContext).toEqual(initialContext);
  });

  it("should deactivate critique mode and reset context", () => {
    const manager = new CritiqueLoopManager();
    const initialContext: CritiqueContext = {
      isCritiqueActive: true,
      severity: "minor",
      violationSummary: "Minor style issue",
      requiredActions: ["Fix formatting"],
      contextMessage: "Please adjust the style.",
    };
    manager.activateCritique(initialContext);
    manager.deactivateCritique();
    expect(manager.isCritiqueActive).toBe(false);
    expect(manager.currentContext).toBeNull();
  });
});