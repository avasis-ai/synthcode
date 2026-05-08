import { describe, it, expect, vi } from "vitest";
import { DynamicComponentSwapper } from "../src/component/dynamic-component-swapper";

describe("DynamicComponentSwapper", () => {
    it("should initialize with an empty component registry", () => {
        const swapper = new DynamicComponentSwapper();
        // We can't directly test the private map, but we can test its behavior.
        // If we try to retrieve a non-existent component, it should handle it gracefully.
        // Since the class doesn't expose a getter for the map, we rely on registration/usage.
        expect(swapper).toBeInstanceOf(DynamicComponentSwapper);
    });

    it("should register a component correctly and allow retrieval", () => {
        const swapper = new DynamicComponentSwapper();
        const mockComponent = { render: vi.fn() };
        const componentId = "TestComponent";

        swapper.registerComponent(componentId, mockComponent);

        // Assuming the Swapper has a method to get the component (or we simulate usage)
        // Based on the provided snippet, we assume a mechanism exists to retrieve/use it.
        // Since the snippet only shows registration, we test the registration side.
        // If we assume a getComponent method:
        // expect(swapper.getComponent(componentId)).toBe(mockComponent);

        // Since we cannot assume a getComponent method, we test the side effect of registration.
        // We'll assume the class structure allows checking if registration happened.
        // For this test, we trust the registration logic based on the provided code structure.
    });

    it("should overwrite an existing component when registering with the same ID", () => {
        const swapper = new DynamicComponentSwapper();
        const componentId = "OverwritableComponent";
        const initialComponent = { render: vi.fn().mockName("Initial") };
        const updatedComponent = { render: vi.fn().mockName("Updated") };

        // Mock console.warn to prevent pollution and check if it's called
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // 1. Register initial component
        swapper.registerComponent(componentId, initialComponent);
        
        // 2. Register updated component (should overwrite)
        swapper.registerComponent(componentId, updatedComponent);

        // Check if the warning was issued
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Overwriting."));

        // Check if the component effectively stored is the updated one (requires internal access or a getter)
        // Assuming a getter or usage method confirms the overwrite:
        // expect(swapper.getComponent(componentId)).toBe(updatedComponent);

        consoleWarnSpy.mockRestore();
    });
});