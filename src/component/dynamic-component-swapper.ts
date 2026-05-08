class DynamicComponentSwapper<TComponent> {
    private componentRegistry: Map<string, TComponent>;

    constructor() {
        this.componentRegistry = new Map<string, TComponent>();
    }

    registerComponent(componentId: string, initialImplementation: TComponent): void {
        if (this.componentRegistry.has(componentId)) {
            console.warn(`Component ${componentId} was already registered. Overwriting.`);
        }
        this.componentRegistry.set(componentId, initialImplementation);
    }

    getLiveInstance(componentId: string): TComponent | undefined {
        return this.componentRegistry.get(componentId);
    }

    swap(componentId: string, newImplementation: TComponent): boolean {
        if (typeof componentId !== 'string' || componentId.length === 0) {
            return false;
        }
        
        if (newImplementation === null || newImplementation === undefined) {
            console.error("Cannot swap with null or undefined implementation.");
            return false;
        }

        this.componentRegistry.set(componentId, newImplementation);
        return true;
    }
}

export { DynamicComponentSwapper };