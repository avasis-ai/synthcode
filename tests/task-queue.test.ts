// src/task-queue.ts
// Task Queue Implementation

import { z } from 'zod';

// Define a Zod schema for task data
const taskSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  payload: z.any(),
  retries: z.number().default(0),
  maxRetries: z.number().default(3),
  createdAt: z.number().default(Date.now()),
  updatedAt: z.number().default(Date.now()),
});

// Define a type for task data based on the Zod schema
export type Task = z.infer<typeof taskSchema>;

// Define a type for task status
export type TaskStatus = Task['status'];

// src/task-queue.test.ts
// Task Queue Tests

import { describe, it, expect } from "vitest";
import { Task, TaskStatus } from "./task-queue";

describe("Task Queue", () => {
  it("should create a task with default values", () => {
    const task = {
      id: "task1",
      name: "Test Task",
      status: "pending",
      payload: { data: "test" },
    } as unknown as Task;

    expect(task).toEqual({
      id: "task1",
      name: "Test Task",
      status: "pending",
      payload: { data: "test" },
      retries: 0,
      maxRetries: 3,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
  });

  it("should update task status and retry count", () => {
    const task = {
      id: "task2",
      name: "Test Task",
      status: "running",
      payload: { data: "test" },
      retries: 1,
      maxRetries: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as unknown as Task;

    task.status = "failed";
    task.retries = 2;

    expect(task).toEqual({
      id: "task2",
      name: "Test Task",
      status: "failed",
      payload: { data: "test" },
      retries: 2,
      maxRetries: 3,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
  });
});