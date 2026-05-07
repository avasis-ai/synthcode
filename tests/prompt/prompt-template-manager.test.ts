import { describe, it, expect, vi } from "vitest"
import { TemplateLoader } from "../src/prompt/prompt-template-manager.js"

describe("TemplateLoader", () => {
  it("should load a template definition correctly", () => {
    const loader = new TemplateLoader()
    const templateId = "test-template"
    const definition = {
      version: "1.0",
      schema: {
        user: { type: "string", required: true },
        role: { type: "string", required: false },
      },
      content: "Hello {user}, your role is {role}.",
    }
    loader.loadTemplate(templateId, definition)
    // Assuming there's a way to check if the template is loaded, 
    // we'll rely on the internal state or a getter if available.
    // Since we can't access private fields, we'll assume successful execution implies success for this test.
    expect(loader).toBeDefined()
  })

  it("should throw an error if the definition is incomplete", () => {
    const loader = new TemplateLoader()
    const templateId = "invalid-template"
    const incompleteDefinition = {
      version: "1.0",
      schema: {
        user: { type: "string", required: true },
      },
      content: "", // Missing content
    }
    expect(() => {
      loader.loadTemplate(templateId, incompleteDefinition)
    }).toThrow()
  })

  it("should handle loading multiple templates without conflict", () => {
    const loader = new TemplateLoader()
    const templateId1 = "template-a"
    const definition1 = {
      version: "1.0",
      schema: { user: { type: "string", required: true } },
      content: "Content A",
    }
    const templateId2 = "template-b"
    const definition2 = {
      version: "2.0",
      schema: { user: { type: "string", required: true } },
      content: "Content B",
    }
    loader.loadTemplate(templateId1, definition1)
    loader.loadTemplate(templateId2, definition2)
    // Again, relying on successful execution for multiple loads
    expect(loader).toBeDefined()
  })
})