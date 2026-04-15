#!/usr/bin/env python3
"""Generate a high-quality demo GIF for the SynthCode TUI GitHub README."""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

OUTPUT = (
    sys.argv[1]
    if len(sys.argv) > 1
    else os.path.join(os.path.dirname(__file__), "..", "assets", "demo.gif")
)
OUTPUT = os.path.abspath(OUTPUT)

BG = (13, 13, 26)
SIDEBAR_BG = (22, 22, 40)
BORDER = (45, 45, 75)
PURPLE = (124, 92, 252)
LPURPLE = (160, 130, 255)
GREEN = (29, 158, 117)
LGREEN = (0, 210, 140)
CYAN = (0, 190, 200)
GRAY = (140, 140, 140)
DGRAY = (90, 90, 90)
DDGRAY = (65, 65, 65)
LGRAY = (204, 204, 204)
WHITE = (240, 240, 240)
YELLOW = (230, 200, 50)
RED = (220, 60, 60)
BLUE = (74, 159, 216)
ORANGE = (239, 159, 39)
TITLEBAR = (28, 28, 48)
INPUT_BG = (18, 18, 34)

FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 11
COLS = 88
ROWS = 18
PAD = 12
BAR_H = 24

font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
bb = font.getbbox("M")
CW = bb[2] - bb[0]
CH = int(font.getbbox("Ay")[3] * 1.7)
IMG_W = COLS * CW + PAD * 2
IMG_H = ROWS * CH + PAD * 2 + BAR_H


def new_frame():
    img = Image.new("RGB", (IMG_W, IMG_H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, IMG_W, BAR_H], fill=TITLEBAR)
    for i, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        cx = 14 + i * 18
        d.ellipse([cx - 5, BAR_H // 2 - 5, cx + 5, BAR_H // 2 + 5], fill=col)
    title = "SynthCode"
    tw = font.getlength(title)
    d.text(((IMG_W - tw) // 2, (BAR_H - FONT_SIZE) // 2), title, fill=LGRAY, font=font)
    return img, d


def put(d, row, col, text, color=LGRAY):
    x = PAD + col * CW
    y = BAR_H + PAD + row * CH
    d.text((x, y), text, fill=color, font=font)


def put_segs(d, row, col, segments):
    x = PAD + col * CW
    y = BAR_H + PAD + row * CH
    for text, color in segments:
        d.text((x, y), text, fill=color, font=font)
        x += font.getlength(text)


def hline(d, row, col=0, width=COLS, color=BORDER):
    x0 = PAD + col * CW
    y = BAR_H + PAD + row * CH + CH // 2
    x1 = PAD + (col + width) * CW
    d.line([(x0, y), (x1, y)], fill=color, width=1)


def rect(d, row, col, rows, cols, outline=BORDER, fill=None):
    x0 = PAD + col * CW - 2
    y0 = BAR_H + PAD + row * CH - 1
    x1 = PAD + (col + cols) * CW + 2
    y1 = BAR_H + PAD + (row + rows) * CH + 1
    if fill:
        d.rectangle([x0, y0, x1, y1], fill=fill)
    d.rectangle([x0, y0, x1, y1], outline=outline, width=1)


def sidebar(d, items, active=1):
    sw = 22
    x0 = PAD
    y0 = BAR_H + PAD
    d.rectangle(
        [x0 - 2, y0 - 1, x0 + sw * CW + 2, y0 + len(items) * CH + 1], fill=SIDEBAR_BG
    )
    for i, (label, is_active) in enumerate(items):
        c = LGREEN if is_active else DGRAY
        prefix = " > " if is_active else "   "
        put(d, i, 0, f"{prefix}{label}", c)


LOGO = [
    r"  _____                 __  __            ",
    r" / ___/ ___  ____ _____/ /_/ /__  _______ ",
    r" \__ \ / _ \/ __ `/ __  / __/ / _ \/ ___/ ",
    r" ___/ //  __/ /_/ / /_/ / /_/ /  __/ /     ",
    r"/____/ \___/\__,_/\__,_/\__/_/\___/_/      ",
    r"",
    r"  Neural Intuition  x  Symbolic Precision  ",
]

GATES = [
    ("plan.parse", "generate token handler", "type_check", "PASS", 4),
    ("plan.validate", "refactor auth middleware", "dep_graph", "VERIFIED", 134),
    ("tool.edit(3)", "add JWT expiry check", "io_boundary", "PASS", 7),
    ("tool.edit(7)", "update imports", "syntax_check", "FAIL", 11),
    ("tool.read(1)", "fix type annotation", "assert_gate", "PASS", 3),
    ("tool.edit(12)", "add error boundary", "contract", "VERIFIED", 198),
    ("tool.write(auth.ts)", "refactor DB query", "type_check", "PASS", 5),
    ("verify.compile", "fix async await", "io_boundary", "PASS", 2),
    ("verify.test", "add test case", "syntax_check", "PASS", 6),
    ("tool.edit(31)", "update schema", "dep_graph", "PASS", 8),
]

RESPONSE_LINES = [
    ("I'll build a snake game with ncurses-style rendering.", LGREEN),
    ("", None),
    ("  /write  src/snake.ts", CYAN),
    ("  -> creating snake game engine", DGRAY),
    ("  -> adding collision detection", DGRAY),
    ("", None),
    ("  [dep_graph]  checking imports...  PASS", LGREEN),
    ("  [type_check] verifying types...   PASS", LGREEN),
    ("  [contract]   validating...        VERIFIED", YELLOW),
    ("", None),
    ("Done! Run `bun run src/snake.ts` to play.", LGREEN),
]


def gen_splash(progress):
    img, d = new_frame()
    n = min(int(progress * len(LOGO)), len(LOGO))
    start_row = (ROWS - len(LOGO)) // 2
    for i in range(n):
        put(
            d,
            start_row + i,
            0,
            LOGO[i],
            PURPLE if i < 5 else LPURPLE if i == 6 else DGRAY,
        )
    return img


def gen_setup(highlight):
    img, d = new_frame()
    put(d, 4, 2, "Setup", WHITE)
    hline(d, 5, 2, 10)
    put(d, 7, 3, "Choose how to connect to a model for inference:", GRAY)
    opts = [
        ("LOCAL MODEL", "Deep system inspection, Ollama SLM"),
        ("CLOUD MODEL", "Gemini / Groq / OpenRouter / OpenAI"),
    ]
    for i, (name, desc) in enumerate(opts):
        r = 9 + i
        c = LGREEN if highlight == i else GRAY
        prefix = "> " if highlight == i else "  "
        put(d, r, 3, f"{prefix}[{i + 1}] {name}", c)
        put(d, r, 22, f"- {desc}", DGRAY)
    return img


def gen_cloud_setup(typed_len):
    img, d = new_frame()
    put(d, 3, 2, "Cloud Provider", WHITE)
    hline(d, 4, 2, 14)
    providers = [
        ("Google Gemini", "gemini-2.5-flash"),
        ("Groq", "llama-3.3-70b-versatile"),
        ("OpenRouter", "anthropic/claude-sonnet-4"),
        ("OpenAI", "gpt-4.1-mini"),
    ]
    for i, (name, model) in enumerate(providers):
        r = 6 + i
        c = LGREEN if i == 0 else GRAY
        prefix = "> " if i == 0 else "  "
        put(d, r, 3, f"{prefix}{name}", c)
        put(d, r, 22, model, DGRAY)
    put(d, 11, 3, "API Key:", GRAY)
    full_key = "sk-test-1234-5678-abcd"
    shown = full_key[:typed_len]
    cursor = "\u2588" if typed_len < len(full_key) else ""
    put(d, 12, 5, shown + cursor, LGREEN)
    return img


def gen_chat(prompt_len, response_lines=0):
    img, d = new_frame()
    sb_items = [
        ("MODES", False),
        ("Chat", True),
        ("Gate Trace", False),
        ("Code View", False),
        ("Playground", False),
    ]
    sidebar(d, sb_items, active=1)
    put(d, 1, 24, "Model: gemini-2.5-flash", LPURPLE)
    hline(d, 2, 23, 64)

    prompt = "build a snake game"
    shown = prompt[:prompt_len]
    cursor = "\u2588" if prompt_len <= len(prompt) else ""
    put(d, ROWS - 4, 24, "> ", CYAN)
    put(d, ROWS - 4, 26, shown + cursor, WHITE)

    if response_lines > 0:
        for i in range(min(response_lines, len(RESPONSE_LINES))):
            text, color = RESPONSE_LINES[i]
            if text:
                put(d, 4 + i, 24, text, color)

    return img


def gen_gate(visible_rows):
    img, d = new_frame()
    sb_items = [
        ("MODES", False),
        ("Chat", False),
        ("Gate Trace", True),
        ("Code View", False),
        ("Playground", False),
    ]
    sidebar(d, sb_items, active=1)
    put(d, 1, 24, "GATE TRACE", BLUE)
    put(d, 1, 36, "session s-042   10 steps", DGRAY)
    hline(d, 2, 23, 64)
    put(d, 3, 24, "Step", DDGRAY)
    put(d, 3, 46, "Output", DDGRAY)
    put(d, 3, 66, "Gate", DDGRAY)
    put(d, 3, 78, "Dec", DDGRAY)
    hline(d, 4, 23, 64)

    n = min(visible_rows, len(GATES))
    for i in range(n):
        step, out, gate, dec, ms = GATES[i]
        r = 5 + i
        dec_color = LGREEN if dec == "PASS" else YELLOW if dec == "VERIFIED" else RED
        put(d, r, 24, step, LGRAY)
        put(d, r, 46, out[:18], GRAY)
        put(d, r, 66, gate, DGRAY)
        put(d, r, 78, f"[{dec}]", dec_color)
        put(d, r, 88, f"{ms}ms", DDGRAY)

    if n > 0:
        hline(d, 5 + n, 23, 64)
        total = n
        passed = sum(1 for g in GATES[:n] if g[3] != "FAIL")
        rate = passed / total * 100
        put(
            d,
            6 + n,
            24,
            f"Steps: {total}  Pass: {rate:.0f}%  Avg: {sum(g[4] for g in GATES[:n]) // max(total, 1)}ms",
            GRAY,
        )

    return img


def gen_hero():
    img, d = new_frame()
    sb_items = [
        ("MODES", False),
        ("Chat", False),
        ("Gate Trace", False),
        ("Code View", True),
        ("Playground", False),
    ]
    sidebar(d, sb_items, active=1)
    put(d, 1, 24, "CODE   src/snake.ts   +16 -1", BLUE)
    hline(d, 2, 23, 64)

    code = [
        (1, " ", 'import { createRenderer } from "./engine";'),
        (2, " ", ""),
        (3, "-", "const SPEED = 200;"),
        (4, "+", 'const SPEED = config.get("game.speed") ?? 150;'),
        (5, "+", "const GRID_W = 40, GRID_H = 30;"),
        (6, " ", "class SnakeGame {"),
        (7, "+", "  body: Point[] = [{ x: 10, y: 15 }];"),
        (8, "+", "  dir: Dir = Dir.RIGHT;"),
        (9, "+", "  food = spawnFood(this.body);"),
        (10, "+", "  score = 0;"),
        (11, " ", "  tick() {"),
        (12, "+", "    const head = this.nextHead();"),
        (13, "+", "    if (this.collides(head)) return this.gameOver();"),
        (14, "+", "    this.body.unshift(head);"),
        (15, "+", "    if (head.eq(this.food)) {"),
        (16, "+", "      this.score += 10;"),
        (17, "+", "    } else { this.body.pop(); }"),
        (18, " ", "  }"),
        (19, " ", "}"),
    ]

    for i, (ln, kind, content) in enumerate(code):
        r = 3 + i
        lc = LGREEN if kind == "+" else RED if kind == "-" else LGRAY
        put_segs(
            d,
            r,
            24,
            [
                (f"{ln:>2} ", DDGRAY),
                (kind + " ", lc),
                (content, lc),
            ],
        )
        if kind == "+" and i % 3 == 0 and content.strip():
            gate_name = [
                "type_check",
                "dep_graph",
                "assert_gate",
                "contract",
                "io_boundary",
            ][i % 5]
            put(d, r, 66, f"[{gate_name}]", DDGRAY)

    return img


def build_gif():
    frames = []

    # Phase 1: Splash (15 frames, logo appears line by line)
    for i in range(15):
        progress = (i + 1) / 15
        frames.append((gen_splash(progress), 120))

    # Hold splash
    frames.append((gen_splash(1.0), 800))

    # Phase 2: Transition to setup (5 frames with highlight moving)
    for i in range(3):
        frames.append((gen_setup(0), 100))
    for i in range(3):
        frames.append((gen_setup(1), 120))

    # Phase 3: Cloud setup with typing (10 frames)
    full_key = "sk-test-1234-5678-abcd"
    for i in range(len(full_key) + 1):
        frames.append((gen_cloud_setup(i), 60))
    frames.append((gen_cloud_setup(len(full_key)), 500))

    # Phase 4: Chat with typing animation (10 frames)
    prompt = "build a snake game"
    for i in range(len(prompt) + 1):
        frames.append((gen_chat(i, 0), 70))
    frames.append((gen_chat(len(prompt), 0), 300))

    # Phase 5: Response streaming (15 frames)
    for i in range(1, len(RESPONSE_LINES) + 1):
        frames.append((gen_chat(len(prompt), i), 150))
    frames.append((gen_chat(len(prompt), len(RESPONSE_LINES)), 800))

    # Phase 6: Gate trace rows appearing (15 frames)
    for i in range(1, len(GATES) + 1):
        frames.append((gen_gate(i), 120))
    frames.append((gen_gate(len(GATES)), 1200))

    # Phase 7: Final hero - code view (5 frames)
    frames.append((gen_hero(), 2000))

    # Optimize: quantize to 256 color palette
    print(f"Total frames: {len(frames)}")

    ref_quant = frames[0][0].quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    images = []
    for img, _ in frames:
        q = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT, palette=ref_quant)
        images.append(q)

    durations = [d for _, d in frames]

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    images[0].save(
        OUTPUT,
        save_all=True,
        append_images=images[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=2,
    )
    size = os.path.getsize(OUTPUT)
    print(f"Written: {OUTPUT}")
    print(f"  Size: {size / 1024:.0f} KB")
    print(f"  Frames: {len(images)}")

    if size > 5 * 1024 * 1024:
        print("GIF is >5MB, reducing quality...")
        images2 = []
        for img, _ in frames:
            q = img.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
            images2.append(q)
        images2[0].save(
            OUTPUT,
            save_all=True,
            append_images=images2[1:],
            duration=durations,
            loop=0,
            optimize=True,
            disposal=2,
        )
        size = os.path.getsize(OUTPUT)
        print(f"  Optimized size: {size / 1024:.0f} KB")

    return OUTPUT, size


if __name__ == "__main__":
    path, size = build_gif()
    print(f"\nDone: {path} ({size / 1024:.0f} KB)")
