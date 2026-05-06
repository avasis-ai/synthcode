import { describe, it, expect } from "vitest";
import { LastWriteWinsResolver, DeepMergeResolver } from "../src/conflict/state-conflict-resolver.js";

describe("Conflict Resolvers", () => {
    it("LastWriteWinsResolver should return the last value in the array", () => {
        const resolver = new LastWriteWinsResolver();
        const field = "testField";
        const values = [1, "two", true, { a: 1 }];
        const result = resolver.resolve(field, values);
        expect(result).toEqual({ a: 1 });
    });

    it("DeepMergeResolver should correctly merge simple objects", () => {
        const resolver = new DeepMergeResolver();
        const field = "testField";
        const values = [{ a: 1, b: 2 }, { b: 3, c: 4 }];
        const result = resolver.resolve(field, values);
        expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("DeepMergeResolver should handle arrays and primitives correctly", () => {
        const resolver = new DeepMergeResolver();
        const field = "testField";
        const values = [
            { id: 1, data: [1, 2] },
            { id: 2, data: [3, 4] }
        ];
        const result = resolver.resolve(field, values);
        expect(result).toEqual({ id: 2, data: [3, 4] });
    });
});