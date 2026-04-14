import type { ToolOperation } from "./types.js";

interface FileNode {
  path: string;
  readAt: number[];
  writtenAt: number[];
  deps: Set<string>;
}

const MAX_HISTORY = 64;
const MAX_FILES = 512;

export class WorldModel {
  private files: Map<string, FileNode> = new Map();
  private history: Array<{
    turn: number;
    tool: string;
    safetyClass: string;
    files: string[];
    success: boolean;
  }> = [];
  private consecutiveFailures = 0;

  recordRead(filePath: string, turn: number): void {
    const normalized = this.normalizePath(filePath);
    const node = this.getOrCreate(normalized);
    node.readAt.push(turn);
    if (node.readAt.length > 20) node.readAt.shift();
    this.evictIfNeeded();
  }

  recordWrite(filePath: string, turn: number): void {
    const normalized = this.normalizePath(filePath);
    const node = this.getOrCreate(normalized);
    node.writtenAt.push(turn);
    if (node.writtenAt.length > 20) node.writtenAt.shift();
    this.evictIfNeeded();
  }

  recordDep(from: string, to: string): void {
    const fromNorm = this.normalizePath(from);
    const toNorm = this.normalizePath(to);
    const node = this.getOrCreate(fromNorm);
    node.deps.add(toNorm);
  }

  recordOperation(turn: number, tool: string, safetyClass: string, files: string[], success: boolean): void {
    this.history.push({ turn, tool, safetyClass, files, success });
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY);
    }
    if (success) {
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }
  }

  hasRead(filePath: string): boolean {
    const node = this.files.get(this.normalizePath(filePath));
    return node !== undefined && node.readAt.length > 0;
  }

  hasBeenWritten(filePath: string): boolean {
    const node = this.files.get(this.normalizePath(filePath));
    return node !== undefined && node.writtenAt.length > 0;
  }

  isKnownFile(filePath: string): boolean {
    return this.files.has(this.normalizePath(filePath));
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  getRecentOperations(count: number): typeof this.history {
    return this.history.slice(-count);
  }

  getFileHistory(filePath: string): { reads: number[]; writes: number[] } | null {
    const node = this.files.get(this.normalizePath(filePath));
    if (!node) return null;
    return { reads: [...node.readAt], writes: [...node.writtenAt] };
  }

  getDeps(filePath: string): string[] {
    const node = this.files.get(this.normalizePath(filePath));
    return node ? [...node.deps] : [];
  }

  resolveFiles(operation: ToolOperation): string[] {
    const paths: string[] = [];
    for (const key of ["path", "filePath", "file_path", "file", "directory", "dir", "cwd"]) {
      const val = operation.input[key];
      if (typeof val === "string" && val.length > 0) paths.push(val);
    }

    if (operation.name === "bash" && typeof operation.input.command === "string") {
      const cmd = operation.input.command as string;
      const fileMatches = cmd.matchAll(/['"]?(\/?[^\s'"<>|;&]+\.[\w]+)['"]?/g);
      for (const m of fileMatches) {
        if (m[1] && !m[1].startsWith("-")) paths.push(m[1]);
      }
    }

    return [...new Set(paths)];
  }

  memoryEstimateBytes(): number {
    let bytes = 0;
    for (const [path, node] of this.files) {
      bytes += path.length * 2;
      bytes += node.readAt.length * 8;
      bytes += node.writtenAt.length * 8;
      bytes += node.deps.size * 64;
    }
    bytes += this.history.length * 128;
    return bytes;
  }

  reset(): void {
    this.files.clear();
    this.history = [];
    this.consecutiveFailures = 0;
  }

  private normalizePath(p: string): string {
    return p.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
  }

  private getOrCreate(normalized: string): FileNode {
    let node = this.files.get(normalized);
    if (!node) {
      node = { path: normalized, readAt: [], writtenAt: [], deps: new Set() };
      this.files.set(normalized, node);
    }
    return node;
  }

  private evictIfNeeded(): void {
    if (this.files.size <= MAX_FILES) return;
    let oldest: string | null = null;
    let oldestTurn = Infinity;
    for (const [path, node] of this.files) {
      const lastActivity = Math.max(
        node.readAt[node.readAt.length - 1] ?? 0,
        node.writtenAt[node.writtenAt.length - 1] ?? 0,
      );
      if (lastActivity < oldestTurn) {
        oldestTurn = lastActivity;
        oldest = path;
      }
    }
    if (oldest) this.files.delete(oldest);
  }
}
