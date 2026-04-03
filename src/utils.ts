import * as fs from "node:fs";
import * as path from "node:path";

export function globToRegExp(pattern: string): RegExp {
  const parts = pattern.split("/");
  let regex = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "**") {
      regex += "(?:[^/]*(?:\\/|$))*";
    } else {
      const escaped = part
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, "[^/]");
      regex += escaped + "\\/";
    }
  }

  regex = regex.replace(/\\\//g, "/").replace(/\/$/, "");
  return new RegExp(`(^|/)${regex}(/|$)`);
}

export interface WalkEntry {
  path: string;
  stat: fs.Stats;
}

export async function walkDir(dir: string, options?: { maxDepth?: number; followSymlinks?: boolean }): Promise<WalkEntry[]> {
  const maxDepth = options?.maxDepth ?? Infinity;
  const followSymlinks = options?.followSymlinks ?? false;
  const results: WalkEntry[] = [];

  async function walk(current: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.name === "node_modules" || entry.name === ".git") continue;

      try {
        let stat: fs.Stats;
        if (entry.isSymbolicLink() && !followSymlinks) continue;
        stat = await fs.promises.stat(fullPath);

        if (stat.isFile()) {
          results.push({ path: fullPath, stat });
        } else if (stat.isDirectory()) {
          await walk(fullPath, depth + 1);
        }
      } catch {
        continue;
      }
    }
  }

  await walk(dir, 0);
  return results;
}
