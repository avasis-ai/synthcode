import { BAR, BLOCK } from "./symbols.js";
import { styled, type Style, blend, C } from "./ansi.js";

export function bar(
  value: number,
  max: number,
  width: number,
  opts?: {
    filledStyle?: Style;
    emptyStyle?: Style;
    label?: string;
    showValue?: boolean;
  }
): string {
  const ratio = Math.min(1, Math.max(0, value / max));
  const totalEighths = Math.round(width * 8 * ratio);
  const fullBlocks = Math.floor(totalEighths / 8);
  const remainder = totalEighths % 8;

  const filled = "\u2588".repeat(fullBlocks) + (remainder > 0 ? BLOCK[remainder] : "");
  const empty = " ".repeat(width - fullBlocks - (remainder > 0 ? 1 : 0));

  const filledStr = opts?.filledStyle
    ? styled(filled, opts.filledStyle)
    : filled;
  const emptyStr = opts?.emptyStyle
    ? styled(empty, opts.emptyStyle)
    : empty;

  let result = filledStr + emptyStr;

  if (opts?.label) {
    result = overlay(result, opts.label, width);
  }

  return result;
}

export function sparkline(
  values: number[],
  opts?: {
    style?: Style;
    width?: number;
    min?: number;
    max?: number;
  }
): string {
  if (values.length === 0) return "";

  const min = opts?.min ?? Math.min(...values);
  const max = opts?.max ?? Math.max(...values);
  const range = max - min || 1;

  const chars = values.map((v) => {
    const idx = Math.round(((v - min) / range) * 8);
    return BAR[Math.min(8, Math.max(0, idx))];
  });

  const text = chars.join("");
  return opts?.style ? styled(text, opts.style) : text;
}

export function gauge(
  value: number,
  max: number,
  width: number,
  opts?: {
    filledChar?: string;
    emptyChar?: string;
    tipChar?: string;
    filledStyle?: Style;
    emptyStyle?: Style;
    label?: string;
  }
): string {
  const ratio = Math.min(1, Math.max(0, value / max));
  const filledWidth = Math.round(width * ratio);

  const filledCh = opts?.filledChar ?? "\u2501";
  const emptyCh = opts?.emptyChar ?? "\u2500";
  const tipCh = opts?.tipChar ?? "\u2578";

  let filled: string;
  if (filledWidth === 0) {
    filled = "";
  } else if (ratio < 1) {
    filled = filledCh.repeat(filledWidth - 1) + tipCh;
  } else {
    filled = filledCh.repeat(filledWidth);
  }

  const empty = emptyCh.repeat(width - filledWidth);

  const filledStr = opts?.filledStyle
    ? styled(filled, opts.filledStyle)
    : filled;
  const emptyStr = opts?.emptyStyle
    ? styled(empty, opts.emptyStyle)
    : empty;

  let result = filledStr + emptyStr;

  if (opts?.label) {
    result = overlay(result, opts.label, width);
  }

  return result;
}

export function gradientBar(
  value: number,
  max: number,
  width: number,
  fromColor: [number, number, number],
  toColor: [number, number, number],
  bgColor?: [number, number, number]
): string {
  const ratio = Math.min(1, Math.max(0, value / max));
  const filledWidth = Math.round(width * ratio);

  const parts: string[] = [];
  for (let i = 0; i < width; i++) {
    const t = width > 1 ? i / (width - 1) : 0;
    const c = i < filledWidth ? blend(fromColor, toColor, t) : (bgColor ?? [30, 30, 40]);
    parts.push(styled("\u2588", { bg: c }));
  }
  return parts.join("");
}

export function benchmarkBar(
  value: number,
  max: number,
  width: number,
  opts?: {
    color?: [number, number, number];
    bgColor?: [number, number, number];
    showPercent?: boolean;
  }
): string {
  const ratio = Math.min(1, Math.max(0, value / max));
  const filledWidth = Math.round(width * ratio);
  const fg = opts?.color ?? [80, 180, 255];
  const bg = opts?.bgColor ?? [35, 35, 50];

  const filled = styled("\u2588".repeat(filledWidth), { bg: fg });
  const empty = styled("\u2588".repeat(width - filledWidth), { bg });
  let result = filled + empty;

  if (opts?.showPercent) {
    const pctStr = `${Math.round(ratio * 100)}%`;
    result = overlay(result, pctStr, width);
  }

  return result;
}

function overlay(barStr: string, label: string, barWidth: number): string {
  const labelStart = Math.floor((barWidth - label.length) / 2);
  if (labelStart < 0) return barStr;
  const resetLabel = `\x1b[0m${label}\x1b[0m`;
  return barStr.slice(0, labelStart * 12) + resetLabel + barStr.slice((labelStart + label.length) * 12);
}
