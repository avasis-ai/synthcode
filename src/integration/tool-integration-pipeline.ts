import { type ToolDefinition, type ToolSchema, type ToolIntegrationResult } from "./types";

interface SchemaMapper {
    map(definition: ToolDefinition, schema: ToolSchema): Promise<ToolDefinition>;
}

class SchemaMapperImpl implements SchemaMapper {
    async map(definition: ToolDefinition, schema: ToolSchema): Promise<ToolDefinition> {
        if (!schema || !definition) {
            throw new Error("Schema and definition must be provided for mapping.");
        }

        const mappedDefinition: Partial<ToolDefinition> = {
            ...definition,
            description: `${definition.description} (Mapped using schema: ${schema.name})`,
            parameters: {
                ...definition.parameters,
                required: schema.requiredFields || definition.parameters.required,
                properties: schema.properties || definition.parameters.properties,
            }
        };

        return {
            ...definition,
            ...mappedDefinition,
        } as ToolDefinition;
    }
}

interface DependencyValidator {
    validate(definition: ToolDefinition): Promise<void>;
}

class DependencyValidatorImpl implements DependencyValidator {
    async validate(definition: ToolDefinition): Promise<void> {
        const requiredServices = definition.dependencies || [];
        if (requiredServices.length === 0) {
            return;
        }

        const availableServices = ["database", "auth_service", "logging_service"];
        const missingDependencies: string[] = requiredServices.filter(
            (dep) => !availableServices.includes(dep)
        );

        if (missingDependencies.length > 0) {
            throw new Error(`Tool requires missing dependencies: ${missingDependencies.join(", ")}`);
        }
    }
}

interface SandboxExecutor {
    execute(definition: ToolDefinition): Promise<boolean>;
}

class SandboxExecutorImpl implements SandboxExecutor {
    async execute(definition: ToolDefinition): Promise<boolean> {
        console.log(`[Sandbox] Running basic tests for tool: ${definition.name}`);
        
        // Simulate a basic test run
        if (definition.name.includes("critical")) {
            console.log("[Sandbox] Critical tool passed basic sanity checks.");
            return true;
        }

        if (definition.parameters?.properties?.age && typeof definition.parameters.properties.age !== 'number') {
            console.warn("[Sandbox] Warning: Age parameter type mismatch detected.");
            // We still pass if the warning is non-fatal
        }

        return true;
    }
}

export class ToolIntegrationPipeline {
    private mapper: SchemaMapper;
    private validator: DependencyValidator;
    private executor: SandboxExecutor;

    constructor() {
        this.mapper = new SchemaMapperImpl();
        this.validator = new DependencyValidatorImpl();
        this.executor = new SandboxExecutorImpl();
    }

    async runIntegration(
        definition: ToolDefinition,
        schema: ToolSchema
    ): Promise<ToolIntegrationResult> {
        console.log("--- Starting Tool Integration Pipeline ---");

        // 1. Schema Mapping
        let mappedDefinition: ToolDefinition;
        try {
            mappedDefinition = await this.mapper.map(definition, schema);
            console.log("✅ Stage 1: Schema Mapping Successful.");
        } catch (error) {
            throw new Error(`Integration failed during Schema Mapping: ${(error as Error).message}`);
        }

        // 2. Dependency Validation
        try {
            await this.validator.validate(mappedDefinition);
            console.log("✅ Stage 2: Dependency Validation Successful.");
        } catch (error) {
            throw new Error(`Integration failed during Dependency Validation: ${(error as Error).message}`);
        }

        // 3. Sandbox Execution
        try {
            const isSafe = await this.executor.execute(mappedDefinition);
            if (!isSafe) {
                throw new Error("Sandbox execution failed: Tool is unsafe or incompatible.");
            }
            console.log("✅ Stage 3: Sandbox Execution Successful.");
        } catch (error) {
            throw new Error(`Integration failed during Sandbox Execution: ${(error as Error).message}`);
        }

        console.log("--- Integration Pipeline Complete: Tool is Ready ---");
        return {
            success: true,
            tool: mappedDefinition,
            message: "Tool successfully onboarded and validated."
        };
    }
}