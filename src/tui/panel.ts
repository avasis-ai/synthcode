import { type BorderSet, ROUNDED } from "./symbols.js";
import { styled, RESET, padAnsi, stripAnsi, type Style, terminalWidth } from "./ansi.js";

export function panel(
  content: string,
  opts?: {
    title?: string;
    subtitle?: string;
    border?: BorderSet;
    borderStyle?: Style;
    width?: number;
    padding?: number;
  }
): string {
  const b = opts?.border ?? ROUNDED;
  const pad = opts?.padding ?? 1;
  const termWidth = opts?.width ?? terminalWidth();
  const bStyle = opts?.borderStyle;

  const innerWidth = termWidth - 2;
  const contentWidth = innerWidth - pad * 2;

  const lines = content.split("\n");
  const padded = lines.map((l) =>
    " ".repeat(pad) + padAnsi(l, contentWidth) + " ".repeat(pad)
  );

  const left = bStyle ? styled(b.midLeft, bStyle) : b.midLeft;
  const right = bStyle ? styled(b.midRight, bStyle) : b.midRight;

  const topBorder = buildHorizontalBorder(
    b.topLeft, b.top, b.topRight,
    innerWidth,
    opts?.title,
    bStyle
  );

  const bottomBorder = buildHorizontalBorder(
    b.bottomLeft, b.bottom, b.bottomRight,
    innerWidth,
    opts?.subtitle,
    bStyle
  );

  const contentLines = padded.map((l) => `${left}${l}${right}`);

  return [topBorder, ...contentLines, bottomBorder].join("\n");
}

function buildHorizontalBorder(
  left: string,
  mid: string,
  right: string,
  width: number,
  title?: string,
  style?: Style
): string {
  if (!title) {
    const line = mid.repeat(width);
    return style
      ? styled(`${left}${line}${right}`, style)
      : `${left}${line}${right}`;
  }

  const titleText = ` ${title} `;
  const titleVisual = stripAnsi(titleText);
  const lineLen = Math.max(1, width - titleVisual - 2);
  const leftLen = Math.floor(lineLen / 2);
  const rightLen = lineLen - leftLen;

  const leftPart = mid.repeat(leftLen);
  const rightPart = mid.repeat(rightLen);

  const borderStr = `${left}${leftPart} ${title} ${rightPart}${right}`;
  return style ? styled(borderStr, style) : borderStr;
}

export function rule(
  title?: string,
  opts?: {
    char?: string;
    style?: Style;
    width?: number;
    align?: "left" | "center" | "right";
  }
): string {
  const ch = opts?.char ?? "\u2500";
  const width = opts?.width ?? terminalWidth();
  const align = opts?.align ?? "center";

  if (!title) {
    const line = ch.repeat(width);
    return opts?.style ? styled(line, opts.style) : line;
  }

  const titleText = ` ${title} `;
  const titleVisual = stripAnsi(titleText);
  const lineLen = Math.max(0, width - titleVisual - 2);
  const styledTitle = opts?.style ? styled(title, opts.style) : title;

  if (align === "left") {
    const right = ch.repeat(lineLen);
    const line = `${ch} ${styledTitle} ${ch}${right}`;
    return opts?.style ? styled(line, opts.style) : line;
  }
  if (align === "right") {
    const left = ch.repeat(lineLen);
    const line = `${left}${ch} ${styledTitle} ${ch}`;
    return opts?.style ? styled(line, opts.style) : line;
  }

  const leftLen = Math.floor(lineLen / 2);
  const rightLen = lineLen - leftLen;
  const left = ch.repeat(leftLen);
  const right = ch.repeat(rightLen);
  const line = `${left}${ch} ${styledTitle} ${ch}${right}`;
  return opts?.style ? styled(line, opts.style) : line;
}
