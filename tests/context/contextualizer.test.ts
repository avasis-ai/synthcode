import { describe, it, expect } from "vitest";
import { Contextualizer, ProjectContext, ToolContext, MetadataProvider } from "../contextualizer";

describe("Contextualizer", () => {
  it("should correctly initialize with project and tool context", () => {
    const projectContext: ProjectContext = {
      projectId: "proj123",
      userId: "user456",
      sessionPriority: 1,
      lastActivityTimestamp: Date.now(),
    };
    const toolContext: ToolContext = {
      messages: [{ role: "user", content: "Hello" }],
      projectId: "proj123",
    };
    const metadataProvider: MetadataProvider = () => ({ source: "test" });

    const contextualizer = new Contextualizer(
      projectContext,
      toolContext,
      metadataProvider
    );

    expect(contextualizer.getProjectContext()).toEqual(projectContext);
    expect(contextualizer.getToolContext()).toEqual(toolContext);
    expect(contextualizer.getMetadata()).toEqual({ source: "test" });
  });

  it("should merge context data correctly", () => {
    const projectContext: ProjectContext = {
      projectId: "proj123",
      userId: "user456",
      sessionPriority: 2,
      lastActivityTimestamp: 1678886400000,
    };
    const toolContext: ToolContext = {
      messages: [{ role: "assistant", content: "Hi" }],
      projectId: "proj123",
    };
    const metadataProvider: MetadataProvider = () => ({ source: "test", version: "v1" });

    const contextualizer = new Contextualizer(
      projectContext,
      toolContext,
      metadataProvider
    );

    const combinedContext = contextualizer.getCombinedContext();

    expect(combinedContext.projectId).toBe("proj123");
    expect(combinedContext.userId).toBe("user456");
    expect(combinedContext.sessionPriority).toBe(2);
    expect(combinedContext.metadata).toEqual({ source: "test", version: "v1" });
  });

  it("should handle missing or empty context data gracefully", () => {
    const projectContext: ProjectContext = {
      projectId: "",
      userId: "",
      sessionPriority: 0,
      lastActivityTimestamp: 0,
    };
    const toolContext: ToolContext = {
      messages: [],
      projectId: "",
    };
    const metadataProvider: MetadataProvider = () => ({});

    const contextualizer = new Contextualizer(
      projectContext,
      toolContext,
      metadataProvider
    );

    const combinedContext = contextualizer.getCombinedContext();

    expect(combinedContext.projectId).toBe("");
    expect(combinedContext.messages).toEqual([]);
    expect(combinedContext.metadata).toEqual({});
  });
});