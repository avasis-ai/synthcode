import type { ToolUseBlock } from "../types.js";

export type ReplacerFn = (content: string, find: string) => Generator<string, void, unknown>;

export class FuzzyEditError extends Error {
  constructor(public readonly kind: "not_found" | "ambiguous", message: string) {
    super(message);
    this.name = "FuzzyEditError";
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (a.length > 1000 || b.length > 1000) return a === b ? 1 : 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function* simpleReplacer(content: string, find: string): Generator<string, void, unknown> {
  if (content.includes(find)) yield find;
}

function* lineTrimmedReplacer(content: string, find: string): Generator<string, void, unknown> {
  const lines = find.split("\n").map(l => l.trim());
  const contentLines = content.split("\n");
  for (let i = 0; i <= contentLines.length - lines.length; i++) {
    if (contentLines.slice(i, i + lines.length).every((cl, idx) => cl.trim() === lines[idx])) {
      yield contentLines.slice(i, i + lines.length).join("\n");
    }
  }
}

function* blockAnchorReplacer(content: string, find: string): Generator<string, void, unknown> {
  const findLines = find.split("\n");
  const contentLines = content.split("\n");

  if (findLines.length < 2) return;

  const firstLine = findLines[0];
  const lastLine = findLines[findLines.length - 1];
  const middleLines = findLines.slice(1, -1);

  for (let i = 0; i <= contentLines.length - findLines.length; i++) {
    if (contentLines[i] !== firstLine) continue;
    const endIdx = i + findLines.length - 1;
    if (contentLines[endIdx] !== lastLine) continue;

    const candidates: { idx: number; score: number }[] = [];

    for (let j = i + 1; j < endIdx; j++) {
      candidates.push({ idx: j, score: 0 });
    }

    let totalScore = 0;
    for (let k = 0; k < middleLines.length; k++) {
      const contentLine = contentLines[i + 1 + k];
      const sim = similarity(middleLines[k], contentLine);
      totalScore += sim;
      if (candidates[k]) candidates[k].score = sim;
    }

    const avgScore = totalScore / middleLines.length;
    const threshold = candidates.length > 1 ? 0.3 : 0.0;

    if (avgScore >= threshold) {
      yield contentLines.slice(i, i + findLines.length).join("\n");
    }
  }
}

function* whitespaceNormalizedReplacer(content: string, find: string): Generator<string, void, unknown> {
  const normFind = find.replace(/\s+/g, " ").trim();
  if (!normFind) return;
  const normContent = content.replace(/\s+/g, " ").trim();
  const idx = normContent.indexOf(normFind);
  if (idx === -1) return;

  const firstWord = normFind.split(" ")[0];
  const lastWord = normFind.split(" ").filter(Boolean).pop()!;
  const firstIdx = content.indexOf(firstWord);
  const lastIdx = content.lastIndexOf(lastWord);
  if (firstIdx === -1 || lastIdx === -1 || lastIdx < firstIdx) return;

  yield content.substring(firstIdx, lastIdx + lastWord.length);
}

function* indentationFlexibleReplacer(content: string, find: string): Generator<string, void, unknown> {
  const lines = find.split("\n");
  const minIndent = Math.min(...lines.filter(l => l.trim().length > 0).map(l => l.match(/^(\s*)/)?.[1].length ?? 0));
  const dedented = lines.map(l => l.substring(minIndent)).join("\n");
  if (content.includes(dedented)) yield dedented;
}

function* escapeNormalizedReplacer(content: string, find: string): Generator<string, void, unknown> {
  const normalized = find
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
  if (content.includes(normalized)) yield normalized;
}

function* trimmedBoundaryReplacer(content: string, find: string): Generator<string, void, unknown> {
  const trimmed = find.trim();
  if (content.includes(trimmed)) yield trimmed;
}

function* contextAwareReplacer(content: string, find: string): Generator<string, void, unknown> {
  const findLines = find.split("\n");
  if (findLines.length < 3) return;

  const firstLine = findLines[0].trim();
  const lastLine = findLines[findLines.length - 1].trim();
  const contentLines = content.split("\n");

  for (let i = 0; i <= contentLines.length - 3; i++) {
    if (contentLines[i].trim() !== firstLine) continue;

    let bestEndIdx = -1;
    let bestScore = 0;

    for (let j = i + 2; j < contentLines.length; j++) {
      if (contentLines[j].trim() === lastLine) {
        const middleCount = j - i - 1;
        let matchCount = 0;
        for (let k = 1; k <= middleCount; k++) {
          const fIdx = Math.floor((k / (middleCount + 1)) * (findLines.length - 2));
          if (fIdx >= 0 && fIdx < findLines.length - 2) {
            if (similarity(contentLines[i + k].trim(), findLines[fIdx + 1].trim()) > 0.5) {
              matchCount++;
            }
          }
        }
        const score = matchCount / middleCount;
        if (score > bestScore) {
          bestScore = score;
          bestEndIdx = j;
        }
      }
    }

    if (bestEndIdx !== -1 && bestScore > 0.5) {
      yield contentLines.slice(i, bestEndIdx + 1).join("\n");
    }
  }
}

const REPLACERS: ReplacerFn[] = [
  simpleReplacer,
  lineTrimmedReplacer,
  blockAnchorReplacer,
  whitespaceNormalizedReplacer,
  indentationFlexibleReplacer,
  escapeNormalizedReplacer,
  trimmedBoundaryReplacer,
  contextAwareReplacer,
];

export function fuzzyReplace(
  content: string,
  oldString: string,
  newString: string,
  replaceAll = false,
): string {
  for (const replacer of REPLACERS) {
    for (const search of replacer(content, oldString)) {
      const idx = content.indexOf(search);
      if (idx === -1) continue;

      if (replaceAll) {
        return content.split(search).join(newString);
      }

      const firstIdx = content.indexOf(search);
      const lastIdx = content.lastIndexOf(search);
      if (firstIdx !== lastIdx) continue;

      return content.substring(0, firstIdx) + newString + content.substring(firstIdx + search.length);
    }
  }

  throw new FuzzyEditError("not_found", `Could not find match for replacement (after 8 fuzzy strategies)`);
}

export function fuzzyContains(content: string, find: string): boolean {
  try {
    fuzzyReplace(content, find, "PLACEHOLDER_CHECK");
    return true;
  } catch {
    return false;
  }
}
