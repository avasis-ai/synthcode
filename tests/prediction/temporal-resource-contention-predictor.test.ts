import { describe, it, expect } from "vitest";
import {
    TemporalResourceContentionPredictor,
    ResourceRequest,
    ContentionDetail,
} from "../src/prediction/temporal-resource-contention-predictor";

describe("TemporalResourceContentionPredictor", () => {
    it("should detect a simple resource contention conflict", () => {
        const predictor = new TemporalResourceContentionPredictor();
        const requests: ResourceRequest[] = [
            {
                resourceName: "CPU",
                amount: 5,
                startTime: 10,
                endTime: 20,
                priority: 1,
            },
            {
                resourceName: "CPU",
                amount: 6,
                startTime: 15,
                endTime: 25,
                priority: 2,
            },
        ];

        const conflicts = predictor.predict(requests);

        expect(conflicts.length).toBe(1);
        const conflict = conflicts[0];
        expect(conflict.resourceName).toBe("CPU");
        expect(conflict.timeStart).toBe(15);
        expect(conflict.timeEnd).toBe(20);
        expect(conflict.requiredCapacity).toBe(11);
        expect(conflict.availableCapacity).toBe(0);
        expect(conflict.conflictSeverity).toBe("HIGH");
    });

    it("should handle multiple resources with no contention", () => {
        const predictor = new TemporalResourceContentionPredictor();
        const requests: ResourceRequest[] = [
            {
                resourceName: "Memory",
                amount: 10,
                startTime: 10,
                endTime: 20,
                priority: 1,
            },
            {
                resourceName: "GPU",
                amount: 5,
                startTime: 30,
                endTime: 40,
                priority: 1,
            },
        ];

        const conflicts = predictor.predict(requests);

        expect(conflicts.length).toBe(0);
    });

    it("should detect contention across different time intervals and resources", () => {
        const predictor = new TemporalResourceContentionPredictor();
        const requests: ResourceRequest[] = [
            {
                resourceName: "Network",
                amount: 2,
                startTime: 0,
                endTime: 10,
                priority: 1,
            },
            {
                resourceName: "Network",
                amount: 3,
                startTime: 5,
                endTime: 15,
                priority: 2,
            },
            {
                resourceName: "Storage",
                amount: 1,
                startTime: 20,
                endTime: 30,
                priority: 1,
            },
            {
                resourceName: "Storage",
                amount: 1,
                startTime: 25,
                endTime: 35,
                priority: 2,
            },
        ];

        const conflicts = predictor.predict(requests);

        expect(conflicts.length).toBe(2);
        // Check the first conflict (Network)
        const networkConflict = conflicts.find(c => c.resourceName === "Network");
        expect(networkConflict).toBeDefined();
        expect(networkConflict!.timeStart).toBe(5);
        expect(networkConflict!.timeEnd).toBe(10);
        expect(networkConflict!.requiredCapacity).toBe(5);
        expect(networkConflict!.conflictSeverity).toBe("MEDIUM");

        // Check the second conflict (Storage)
        const storageConflict = conflicts.find(c => c.resourceName === "Storage");
        expect(storageConflict).toBeDefined();
        expect(storageConflict!.timeStart).toBe(25);
        expect(storageConflict!.timeEnd).toBe(30);
        expect(storageConflict!.requiredCapacity).toBe(2);
        expect(storageConflict!.conflictSeverity).toBe("MEDIUM");
    });
});