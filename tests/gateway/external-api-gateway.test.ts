import { describe, it, expect, vi } from "vitest";
import { ExternalApiGateway } from "../../../src/gateway/external-api-gateway.js";

describe("ExternalApiGateway", () => {
    it("should successfully call an external API with GET method and basic auth", async () => {
        const mockApiCall = vi.fn(() => Promise.resolve({ data: { id: 1, name: "Test" } }));
        const gateway = new ExternalApiGateway(mockApiCall);

        const config = {
            endpoint: "https://api.example.com/data",
            method: "GET",
            headers: { "Content-Type": "application/json" },
            auth: {
                type: "BASIC",
                credentials: { username: "user", password: "pass" },
            },
        };

        const result = await gateway.call(config);

        expect(mockApiCall).toHaveBeenCalledTimes(1);
        expect(mockApiCall).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "https://api.example.com/data",
                method: "GET",
                headers: { "Content-Type": "application/json" },
                body: null,
                auth: { username: "user", password: "pass" },
            })
        );
        expect(result).toEqual({ success: true, data: { id: 1, name: "Test" } });
    });

    it("should handle API failures and execute fallback function if provided", async () => {
        const mockApiCall = vi.fn(() => Promise.reject(new Error("API Down")));
        const fallbackFn = vi.fn(() => Promise.resolve({ fallbackData: true }));
        const gateway = new ExternalApiGateway(mockApiCall);

        const config = {
            endpoint: "https://api.example.com/fail",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            auth: {
                type: "API_KEY",
                credentials: "dummy-key",
            },
            fallback: fallbackFn,
        };

        const result = await gateway.call(config);

        expect(mockApiCall).toHaveBeenCalledTimes(1);
        expect(fallbackFn).toHaveBeenCalledWith(expect.any(Error));
        expect(result).toEqual({ success: true, data: { fallbackData: true } });
    });

    it("should retry API calls up to maxRetries times on failure", async () => {
        const mockApiCall = vi.fn()
            .mockRejectedValueOnce(new Error("Transient Error 1"))
            .mockRejectedValueOnce(new Error("Transient Error 2"))
            .mockResolvedValueOnce({ data: { final: true } });
        const gateway = new ExternalApiGateway(mockApiCall);

        const config = {
            endpoint: "https://api.example.com/retry",
            method: "GET",
            headers: {},
            auth: {
                type: "API_KEY",
                credentials: "key",
            },
            maxRetries: 2,
        };

        const result = await gateway.call(config);

        expect(mockApiCall).toHaveBeenCalledTimes(3);
        expect(result).toEqual({ success: true, data: { final: true } });
    });
});