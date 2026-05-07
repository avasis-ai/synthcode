import { describe, it, expect } from "vitest";
import { PromptTemplateRegistry } from "../../../src/prompt/prompt-template-registry";

describe("PromptTemplateRegistry", () => {
  it("should initialize correctly and register templates", () => {
    const registry = new PromptTemplateRegistry();
    expect(registry).toBeInstanceOf(PromptTemplateRegistry);
    expect(registry.getTemplateCount()).toBe(0);
  });

  it("should allow registering a new template by name", () => {
    const registry = new PromptTemplateRegistry();
    const templateName = "test_template";
    const templateContent = "This is a test prompt.";
    registry.registerTemplate(templateName, templateContent);

    expect(registry.getTemplateCount()).toBe(1);
    expect(registry.getTemplate(templateName)).toBe(templateContent);
  });

  it("should overwrite an existing template when registering with the same name", () => {
    const registry = new PromptTemplateRegistry();
    const templateName = "overwritten_template";
    const initialContent = "Initial content.";
    const updatedContent = "Updated content.";

    registry.registerTemplate(templateName, initialContent);
    expect(registry.getTemplate(templateName)).toBe(initialContent);

    registry.registerTemplate(templateName, updatedContent);
    expect(registry.getTemplate(templateName)).toBe(updatedContent);
    expect(registry.getTemplateCount()).toBe(1);
  });
});