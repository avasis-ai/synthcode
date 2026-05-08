import { describe, it, expect } from "vitest"
import { SkillRecipeManager } from "../../../src/skill/skill-recipe-manager"

describe("SkillRecipeManager", () => {
  it("should initialize correctly", () => {
    const manager = new SkillRecipeManager()
    expect(manager).toBeDefined()
  })

  it("should add a recipe and retrieve it by name", async () => {
    const manager = new SkillRecipeManager()
    const recipe = {
      name: "Cooking Skill",
      steps: ["Chop vegetables", "Cook meal"],
      difficulty: "Intermediate",
    }
    await manager.addRecipe(recipe)
    const retrievedRecipe = await manager.getRecipeByName("Cooking Skill")
    expect(retrievedRecipe).toEqual(recipe)
  })

  it("should handle adding recipes with the same name (overwriting)", async () => {
    const manager = new SkillRecipeManager()
    const recipe1 = {
      name: "Baking Skill",
      steps: ["Mix ingredients", "Bake"],
      difficulty: "Beginner",
    }
    const recipe2 = {
      name: "Baking Skill",
      steps: ["Cream butter", "Fold egg whites"],
      difficulty: "Advanced",
    }
    await manager.addRecipe(recipe1)
    await manager.addRecipe(recipe2)
    const retrievedRecipe = await manager.getRecipeByName("Baking Skill")
    expect(retrievedRecipe).toEqual(recipe2)
  })
})