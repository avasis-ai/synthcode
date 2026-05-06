import { describe, it, expect } from "vitest";
import { HtmlStripper, RegexCleaner } from "../src/sanitization/sanitization-pipeline";

describe("Sanitization Pipeline", () => {
    it("should correctly strip HTML tags using HtmlStripper", () => {
        const stripper = new HtmlStripper();
        const maliciousInput = "<script>alert('xss')</script><h1>Title</h1><p>Content</p>";
        const cleaned = stripper.sanitize(maliciousInput);
        expect(cleaned).toBe("Title\nContent");
    });

    it("should clean specific patterns using RegexCleaner", () => {
        const cleaner = new RegexCleaner();
        const inputWithBadData = "User input with <script>alert(1)</script> and bad data.";
        const cleaned = cleaner.sanitize(inputWithBadData);
        expect(cleaned).toBe("User input with  and bad data.");
    });

    it("should handle non-string inputs gracefully", () => {
        const stripper = new HtmlStripper();
        const cleaner = new RegexCleaner();

        // Test HtmlStripper with non-string
        const result1 = stripper.sanitize(12345);
        expect(result1).toBe(12345);

        // Test RegexCleaner with non-string
        const result2 = cleaner.sanitize(null);
        expect(result2).toBe(null);
    });
});