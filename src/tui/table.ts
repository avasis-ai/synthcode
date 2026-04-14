import { type BorderSet, ROUNDED, HEAVY_HEAD } from "./symbols.js";
import { styled, padAnsi, stripAnsi, type Style, terminalWidth, RESET } from "./ansi.js";

export interface Column {
  header: string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
  style?: Style;
  headerStyle?: Style;
}

export interface TableOpts {
  border?: BorderSet;
  borderStyle?: Style;
  headerStyle?: Style;
  rowStyle?: Style;
  alternateRowBg?: [number, number, number];
  columns: Column[];
  rows: Record<string, string>[];
  width?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function table(opts: TableOpts): string {
  const b = opts.border ?? HEAVY_HEAD;
  const termWidth = opts.width ?? terminalWidth();
  const colDefs = opts.columns;
  const rows = opts.rows;

  const colWidths = computeWidths(colDefs, rows, termWidth);
  const lines: string[] = [];

  if (opts.showHeader !== false) {
    lines.push(renderBorder(b, colWidths, "top", opts.borderStyle));
    lines.push(renderHeaderRow(colDefs, colWidths, b, opts.headerStyle, opts.borderStyle));
    lines.push(renderBorder(b, colWidths, "head", opts.borderStyle));
  } else {
    lines.push(renderBorder(b, colWidths, "top", opts.borderStyle));
  }

  for (let i = 0; i < rows.length; i++) {
    const rowStyle = getRowStyle(i, opts);
    lines.push(renderRow(colDefs, colWidths, rows[i], b, rowStyle, opts.borderStyle));
  }

  lines.push(renderBorder(b, colWidths, "bottom", opts.borderStyle));
  return lines.join("\n");
}

function computeWidths(
  cols: Column[],
  rows: Record<string, string>[],
  totalWidth: number
): number[] {
  const borderWidth = 1 + cols.length;
  const available = totalWidth - borderWidth;

  const minWidths = cols.map((c) => {
    const headerLen = stripAnsi(c.header);
    let maxDataLen = headerLen;
    for (const row of rows) {
      const val = row[c.key] ?? "";
      const len = stripAnsi(val);
      if (len > maxDataLen) maxDataLen = len;
    }
    return Math.min(maxDataLen, Math.floor(totalWidth / 2));
  });

  const explicitWidths = cols.map((c) => c.width);
  const hasExplicit = explicitWidths.some((w) => w != null);

  if (hasExplicit) {
    const explicitSum = explicitWidths.reduce(
      (sum: number, w, i) => sum + (w ?? minWidths[i] ?? 0),
      0
    );
    return explicitWidths.map((w, i) => w ?? minWidths[i]);
  }

  const totalMin = minWidths.reduce((a, b) => a + b, 0);
  if (totalMin <= available) {
    const extra = available - totalMin;
    const perCol = Math.floor(extra / cols.length);
    return minWidths.map((w) => w + perCol);
  }

  return minWidths.map((w) => Math.max(4, Math.floor(available / cols.length)));
}

function renderBorder(
  b: BorderSet,
  widths: number[],
  type: "top" | "head" | "bottom",
  style?: Style
): string {
  const left = type === "top" ? b.topLeft : type === "head" ? b.headLeft : b.bottomLeft;
  const mid = type === "top" ? b.top : type === "head" ? b.head : b.bottom;
  const right = type === "top" ? b.topRight : type === "head" ? b.headRight : b.bottomRight;

  const parts = widths.map((w) => mid.repeat(w));
  const line = `${left}${parts.join(mid)}${right}`;
  return style ? styled(line, style) : line;
}

function renderHeaderRow(
  cols: Column[],
  widths: number[],
  b: BorderSet,
  headerStyle?: Style,
  borderStyle?: Style
): string {
  const left = borderStyle ? styled(b.midLeft, borderStyle) : b.midLeft;
  const right = borderStyle ? styled(b.midRight, borderStyle) : b.midRight;
  const sep = borderStyle ? styled(b.midLeft, borderStyle) : "\u2502";

  const cells = cols.map((c, i) => {
    const s = c.headerStyle ?? headerStyle;
    const text = s ? styled(c.header, s) : c.header;
    return padAnsi(text, widths[i], c.align ?? "left");
  });

  return `${left}${cells.join(sep)}${right}`;
}

function renderRow(
  cols: Column[],
  widths: number[],
  row: Record<string, string>,
  b: BorderSet,
  rowStyle?: Style,
  borderStyle?: Style
): string {
  const left = borderStyle ? styled(b.midLeft, borderStyle) : b.midLeft;
  const right = borderStyle ? styled(b.midRight, borderStyle) : b.midRight;
  const sep = borderStyle ? styled(b.midLeft, borderStyle) : "\u2502";

  const cells = cols.map((c, i) => {
    let text = row[c.key] ?? "";
    if (rowStyle && !c.style) text = styled(text, rowStyle);
    if (c.style) text = styled(stripAnsiRaw(text), c.style);
    return padAnsi(text, widths[i], c.align ?? "left");
  });

  return `${left}${cells.join(sep)}${right}`;
}

function getRowStyle(index: number, opts: TableOpts): Style | undefined {
  if (opts.rowStyle) return opts.rowStyle;
  if (opts.alternateRowBg && index % 2 === 1) {
    return { bg: opts.alternateRowBg };
  }
  return undefined;
}

function stripAnsiRaw(str: string): string {
  const parts: string[] = [];
  let inEscape = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\x1b") { inEscape = true; continue; }
    if (inEscape) {
      if (str[i] >= "@" && str[i] <= "~") inEscape = false;
      continue;
    }
    parts.push(str[i]);
  }
  return parts.join("");
}
