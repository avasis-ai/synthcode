import { describe, it, expect } from "vitest";
import { ResourceReservationManager } from "../src/resource/resource-reservation-manager.js";

describe("ResourceReservationManager", () => {
    it("should successfully book a resource if no overlap exists", () => {
        const manager = new ResourceReservationManager();
        const resourceId = "RoomA";
        const owner = "Alice";
        const startTime = new Date("2024-01-01T10:00:00Z");
        const endTime = new Date("2024-01-01T11:00:00Z");

        const result = manager.bookResource(resourceId, owner, startTime, endTime);

        expect(result.success).toBe(true);
        expect(result.message).toContain("Resource booked successfully");
    });

    it("should fail to book a resource if it overlaps with an existing reservation", () => {
        const manager = new ResourceReservationManager();
        const resourceId = "RoomB";
        const owner1 = "Bob";
        const owner2 = "Charlie";

        // Book initial reservation
        const startTime1 = new Date("2024-01-01T10:00:00Z");
        const endTime1 = new Date("2024-01-01T11:00:00Z");
        manager.bookResource(resourceId, owner1, startTime1, endTime1);

        // Attempt overlapping booking (starts before and ends after)
        const startTime2 = new Date("2024-01-01T10:30:00Z");
        const endTime2 = new Date("2024-01-01T11:30:00Z");

        const result = manager.bookResource(resourceId, owner2, startTime2, endTime2);

        expect(result.success).toBe(false);
        expect(result.message).toContain("Overlap detected");
    });

    it("should allow booking if the new reservation is immediately adjacent to an existing one", () => {
        const manager = new ResourceReservationManager();
        const resourceId = "RoomC";
        const owner1 = "David";
        const owner2 = "Eve";

        // Book initial reservation (ends at 10:00)
        const startTime1 = new Date("2024-01-01T09:00:00Z");
        const endTime1 = new Date("2024-01-01T10:00:00Z");
        manager.bookResource(resourceId, owner1, startTime1, endTime1);

        // Attempt adjacent booking (starts exactly at 10:00)
        const startTime2 = new Date("2024-01-01T10:00:00Z");
        const endTime2 = new Date("2024-01-01T11:00:00Z");

        const result = manager.bookResource(resourceId, owner2, startTime2, endTime2);

        expect(result.success).toBe(true);
    });
});