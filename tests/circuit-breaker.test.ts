// src/circuit-breaker.ts
// TypeScript implementation of a circuit breaker pattern
// for SynthCode.

// Import necessary libraries
import { z } from 'zod';

// Define the circuit breaker class
class CircuitBreaker {
  // Configuration options
  private readonly maxFailures: number;
  private readonly resetTimeout: number;
  private readonly name: string;

  // Internal state
  private failureCount: number;
  private isOpen: boolean;
  private lastFailureTime: number | null;

  constructor(name: string, maxFailures: number, resetTimeout: number) {
    this.name = name;
    this.maxFailures = maxFailures;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.isOpen = false;
    this.lastFailureTime = null;
  }

  // Method to record a failure
  recordFailure(): void {
    this.failureCount++;
    this.isOpen = this.failureCount >= this.maxFailures;
    this.lastFailureTime = Date.now();
  }

  // Method to reset the circuit breaker
  reset(): void {
    this.failureCount = 0;
    this.isOpen = false;
    this.lastFailureTime = null;
  }

  // Method to check if the circuit breaker is open
  isOpen(): boolean {
    return this.isOpen;
  }

  // Method to get the number of failures
  getFailures(): number {
    return this.failureCount;
  }

  // Method to get the last failure time
  getLastFailureTime(): number | null {
    return this.lastFailureTime;
  }
}

// Export the circuit breaker class
export default CircuitBreaker;

// TypeScript test file for the circuit breaker
import { describe, it, expect } from "vitest";
import CircuitBreaker from "./circuit-breaker";

describe("CircuitBreaker", () => {
  it("should record failures", () => {
    const breaker = new CircuitBreaker("test", 3, 1000);
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
    expect(breaker.getFailures()).toBe(3);
  });

  it("should reset the circuit breaker", () => {
    const breaker = new CircuitBreaker("test", 3, 1000);
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.reset();
    expect(breaker.isOpen()).toBe(false);
    expect(breaker.getFailures()).toBe(0);
  });

  it("should not open the circuit breaker if it has not failed", () => {
    const breaker = new CircuitBreaker("test", 3, 1000);
    expect(breaker.isOpen()).toBe(false);
    expect(breaker.getFailures()).toBe(0);
  });
});