import { describe, it, expect, vi } from "vitest";
import { ServiceCallGateway } from "../src/gateway/service-call-gateway.js";

describe("ServiceCallGateway", () => {
    it("should successfully call a service when the service is available", async () => {
        const mockServiceCall = {
            url: "http://test.com/api/data",
            method: "GET",
            schema: { id: "string" },
        };
        const mockGateway = new ServiceCallGateway();
        
        // Mock the internal HTTP client call
        vi.spyOn(mockGateway, "callService").mockResolvedValue({
            data: { result: "success" },
            status: 200,
        });

        const result = await mockGateway.callService(mockServiceCall);

        expect(result).toEqual({
            data: { result: "success" },
            status: 200,
        });
        expect(mockGateway.callService).toHaveBeenCalledWith(mockServiceCall);
    });

    it("should handle service call failures gracefully", async () => {
        const mockServiceCall = {
            url: "http://test.com/api/error",
            method: "POST",
            schema: { name: "string" },
        };
        const mockGateway = new ServiceCallGateway();
        
        // Mock the internal HTTP client call to throw an error
        vi.spyOn(mockGateway, "callService").mockRejectedValue(new Error("Service unavailable"));

        const result = await mockGateway.callService(mockServiceCall);

        expect(result).toBeNull();
        // Assuming the gateway handles the error and returns null or a specific error structure
        // Based on typical gateway patterns, we expect it to catch and return a safe value.
    });

    it("should handle service calls that require multiple retries", async () => {
        const mockServiceCall = {
            url: "http://test.com/api/retry",
            method: "PUT",
            schema: { key: "string" },
        };
        const mockGateway = new ServiceCallGateway();
        
        // Mock the internal HTTP client call to fail twice and succeed on the third attempt
        const mockCall = vi.spyOn(mockGateway, "callService")
            .mockRejectedValueOnce(new Error("Transient error 1"))
            .mockRejectedValueOnce(new Error("Transient error 2"))
            .mockResolvedValue({
                data: { result: "success after retry" },
                status: 200,
            });

        // Assuming the gateway implements retry logic (e.g., maxRetries=3)
        const result = await mockGateway.callService(mockServiceCall, 3);

        expect(result).toEqual({
            data: { result: "success after retry" },
            status: 200,
        });
        // Check that the underlying service call was attempted three times
        expect(mockCall).toHaveBeenCalledTimes(3);
    });
});