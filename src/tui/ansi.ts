export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const ITALIC = "\x1b[3m";
export const UNDERLINE = "\x1b[4m";
export const BLINK = "\x1b[5m";
export const REVERSE = "\x1b[7m";
export const STRIKETHROUGH = "\x1b[9m";
export const HIDDEN = "\x1b[8m";

export function fg(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function bg(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

export function fg256(n: number): string {
  return `\x1b[38;5;${n}m`;
}

export function bg256(n: number): string {
  return `\x1b[48;5;${n}m`;
}

export function fg16(name: string): string {
  const codes: Record<string, string> = {
    black: "\x1b[30m", red: "\x1b[31m", green: "\x1b[32m",
    yellow: "\x1b[33m", blue: "\x1b[34m", magenta: "\x1b[35m",
    cyan: "\x1b[36m", white: "\x1b[37m",
    bright_black: "\x1b[90m", bright_red: "\x1b[91m",
    bright_green: "\x1b[92m", bright_yellow: "\x1b[93m",
    bright_blue: "\x1b[94m", bright_magenta: "\x1b[95m",
    bright_cyan: "\x1b[96m", bright_white: "\x1b[97m",
  };
  return codes[name] ?? "";
}

export type ColorLevel = 0 | 1 | 2 | 3;

export function detectColorLevel(): ColorLevel {
  const term = process.env.TERM ?? "";
  const colorTerm = process.env.COLORTERM ?? "";
  const noColor = process.env.NO_COLOR ?? process.env.NODE_DISABLE_COLORS;
  if (noColor && noColor !== "0") return 0;
  if (colorTerm === "truecolor" || colorTerm === "24bit") return 3;
  if (term.includes("256color") || term.includes("xterm")) return 2;
  if (term.includes("ansi") || term.includes("color")) return 1;
  if (process.platform === "win32") return 1;
  return 1;
}

export function rgbTo256(r: number, g: number, b: number): number {
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round(((r - 8) / 247) * 24) + 232;
  }
  return (
    16 +
    36 * Math.round((r / 255) * 5) +
    6 * Math.round((g / 255) * 5) +
    Math.round((b / 255) * 5)
  );
}

export interface Style {
  fg?: [number, number, number];
  bg?: [number, number, number];
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export function applyStyle(s: Style, level: ColorLevel = detectColorLevel()): string {
  const parts: string[] = [];
  if (s.bold) parts.push(BOLD);
  if (s.dim) parts.push(DIM);
  if (s.italic) parts.push(ITALIC);
  if (s.underline) parts.push(UNDERLINE);
  if (s.fg) {
    if (level >= 3) parts.push(fg(s.fg[0], s.fg[1], s.fg[2]));
    else if (level >= 2) parts.push(fg256(rgbTo256(s.fg[0], s.fg[1], s.fg[2])));
    else parts.push(fg16(approximate16(s.fg)));
  }
  if (s.bg) {
    if (level >= 3) parts.push(bg(s.bg[0], s.bg[1], s.bg[2]));
    else if (level >= 2) parts.push(bg256(rgbTo256(s.bg[0], s.bg[1], s.bg[2])));
  }
  return parts.join("");
}

function approximate16(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  if (r > 200 && g < 80 && b < 80) return "red";
  if (r < 80 && g > 200 && b < 80) return "green";
  if (r < 80 && g < 80 && b > 200) return "blue";
  if (r > 200 && g > 200 && b < 80) return "yellow";
  if (r > 200 && g < 80 && b > 200) return "magenta";
  if (r < 80 && g > 200 && b > 200) return "cyan";
  if (r > 200 && g > 200 && b > 200) return "white";
  if (r > 128 || g > 128 || b > 128) return "bright_black";
  return "white";
}

export function styled(text: string, s: Style): string {
  return `${applyStyle(s)}${text}${RESET}`;
}

export function moveUp(n: number): string {
  return n > 0 ? `\x1b[${n}A` : "";
}

export function moveDown(n: number): string {
  return n > 0 ? `\x1b[${n}B` : "";
}

export function clearLine(): string {
  return "\x1b[2K\r";
}

export function terminalWidth(): number {
  return process.stdout.columns ?? 80;
}

export function stripAnsi(str: string): number {
  let len = 0;
  let inEscape = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\x1b") { inEscape = true; continue; }
    if (inEscape) {
      if (str[i] >= "@" && str[i] <= "~") inEscape = false;
      continue;
    }
    len++;
  }
  return len;
}

export function padAnsi(str: string, width: number, align: "left" | "center" | "right" = "left"): string {
  const visual = stripAnsi(str);
  const pad = Math.max(0, width - visual);
  if (align === "right") return " ".repeat(pad) + str;
  if (align === "center") return " ".repeat(Math.floor(pad / 2)) + str + " ".repeat(Math.ceil(pad / 2));
  return str + " ".repeat(pad);
}

export function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (stripAnsi(current) + 1 + stripAnsi(word) <= width) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export const C = {
  black: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  darkGray: [60, 60, 60] as [number, number, number],
  red: [220, 50, 50] as [number, number, number],
  green: [50, 200, 80] as [number, number, number],
  blue: [60, 120, 220] as [number, number, number],
  cyan: [80, 200, 200] as [number, number, number],
  yellow: [220, 200, 50] as [number, number, number],
  magenta: [180, 80, 220] as [number, number, number],
  orange: [240, 150, 40] as [number, number, number],
  purple: [150, 80, 200] as [number, number, number],
  teal: [40, 180, 160] as [number, number, number],
  pink: [240, 100, 150] as [number, number, number],
  lime: [160, 220, 60] as [number, number, number],
  indigo: [80, 60, 200] as [number, number, number],
  amber: [240, 180, 40] as [number, number, number],
  rose: [220, 60, 100] as [number, number, number],
  sky: [100, 180, 240] as [number, number, number],
  mint: [100, 220, 160] as [number, number, number],

  synthBlack: [18, 18, 24] as [number, number, number],
  synthBg: [26, 26, 36] as [number, number, number],
  synthFg: [220, 220, 230] as [number, number, number],
  synthAccent: [100, 180, 255] as [number, number, number],
  synthGreen: [80, 220, 120] as [number, number, number],
  synthYellow: [240, 200, 60] as [number, number, number],
  synthRed: [240, 80, 80] as [number, number, number],
  synthMuted: [100, 100, 120] as [number, number, number],
  synthDim: [70, 70, 85] as [number, number, number],
};

export function blend(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}
