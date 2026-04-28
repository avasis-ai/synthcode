import { describe, it, expect } from "vitest";
import {
    SchemaConflictError,
    ConflictResolutionStrategy,
    SchemaMergeOptions,
} from "../src/schema/structured-output-schema-merger";
import { z, ZodSchema } from "zod";

describe("SchemaMerger", () => {
    it("should merge two simple schemas with 'prefer_latest' strategy", () => {
        const schema1 = z.object({
            id: z.string(),
            name: z.string(),
        });
        const schema2 = z.object({
            name: z.string().optional(),
            email: z.string().email(),
        });

        const options: SchemaMergeOptions = {
            conflictStrategy: "prefer_latest",
        };

        const mergedSchema = SchemaMerger.merge(
            schema1,
            schema2,
            options
        );

        expect(mergedSchema).toBeDefined();
        // Check if 'id' from schema1 is present
        expect(mergedSchema.shape.id).toBeDefined();
        // Check if 'name' from schema2 overwrote/merged correctly
        expect(mergedSchema.shape.name).toBeDefined();
        // Check if 'email' from schema2 is present
        expect(mergedSchema.shape.email).toBeDefined();
    });

    it("should handle type conflicts using 'union_all' strategy", () => {
        const schema1 = z.object({
            value: z.string(),
        });
        const schema2 = z.object({
            value: z.number(),
        });

        const options: SchemaMergeOptions = {
            conflictStrategy: "union_all",
        };

        const mergedSchema = SchemaMerger.merge(
            schema1,
            schema2,
            options
        );

        expect(mergedSchema).toBeDefined();
        // With union_all, the resulting schema for 'value' should accept both string and number
        const valueSchema = mergedSchema.shape.value as z.ZodType<any>;
        // A simple check: ensure the resulting schema is not just one type
        expect(valueSchema.safeParse("test")?.success).toBe(true);
        expect(valueSchema.safeParse(123)?.success).toBe(true);
    });

    it("should throw SchemaConflictError on incompatible types with 'strict_intersection'", () => {
        const schema1 = z.object({
            count: z.string(),
        });
        const schema2 = z.object({
            count: z.number(),
        });

        const options: SchemaMergeOptions = {
            conflictStrategy: "strict_intersection",
        };

        // Expect the merge operation to throw the specific error
        expect(() => {
            SchemaMerger.merge(
                schema1,
                schema2,
                options
            );
        }).toThrow(SchemaConflictError);

        // Optionally, check the error details
        try {
            SchemaMerger.merge(
                schema1,
                schema2,
                options
            );
        } catch (e) {
            const error = e as SchemaConflictError;
            expect(error.field).toBe("count");
            expect(error.schemas).toHaveLength(2);
        }
    });
});