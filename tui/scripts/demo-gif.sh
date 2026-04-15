#!/usr/bin/env bash
# demo-gif.sh — Generate a demo GIF for the SynthCode TUI app
# Uses asciinema+agg (real recording) or Python/Pillow (rendered frames) as fallback
set -uo pipefail

PROJECT_DIR="/Users/abhay/synthcode-opentui"
OUTPUT_GIF="$PROJECT_DIR/assets/demo.gif"
CAST_FILE="/tmp/synthcode-demo.cast"
EXPECT_SCRIPT="/tmp/synthcode-demo.exp"

mkdir -p "$PROJECT_DIR/assets"

command -v asciinema &>/dev/null && has_asciinema=y || has_asciinema=n
command -v agg &>/dev/null && has_agg=y || has_agg=n
command -v expect &>/dev/null && has_expect=y || has_expect=n
python3 -c "from PIL import Image, ImageDraw, ImageFont" &>/dev/null && has_pillow=y || has_pillow=n

echo ":: Tools  asciinema=$has_asciinema  agg=$has_agg  expect=$has_expect  pillow=$has_pillow"

# ── Approach 1: asciinema + agg + expect (records the real app) ─────
if [ "$has_asciinema" = y ] && [ "$has_agg" = y ] && [ "$has_expect" = y ]; then
    echo ""
    echo "== Recording real app with asciinema =="

    cat > "$EXPECT_SCRIPT" << 'EXPECT_EOF'
#!/usr/bin/expect -f
set timeout 20

spawn asciinema rec --cols 96 --rows 28 --idle-time-limit 2 /tmp/synthcode-demo.cast

expect {
    -re {[$#>] $} {}
    timeout { puts "TIMEOUT: shell prompt"; exit 1 }
}
sleep 0.3

send "cd /Users/abhay/synthcode-opentui && SYNTHCODE_API_KEY=test MORPH_API_KEY=test bun run src/main.ts\r"

sleep 2.5
send " "

sleep 1.5
send "\x1b\[B"
sleep 0.5
send "\r"

sleep 1.5
send "sk-test-1234-5678-abcd"
sleep 0.5
send "\r"

sleep 1.0
send "\r"

sleep 2.0

send "/mode gate\r"
sleep 2.5

send "/mode code\r"
sleep 2.5

send "\x03"
sleep 1

expect {
    -re {[$#>] $} {}
    timeout {}
}
sleep 0.2
send "exit\r"
expect eof
EXPECT_EOF

    chmod +x "$EXPECT_SCRIPT"

    if "$EXPECT_SCRIPT" 2>&1; then
        if [ -f "$CAST_FILE" ]; then
            echo "Converting to GIF with agg..."
            if agg --font-size 14 --theme dracula --idle-time-limit 1.5 --speed 1.2 --last-frame-duration 2 \
                   "$CAST_FILE" "$OUTPUT_GIF" 2>&1; then
                :
            fi

            if [ -f "$OUTPUT_GIF" ]; then
                size=$(stat -f%z "$OUTPUT_GIF" 2>/dev/null || stat -c%s "$OUTPUT_GIF" 2>/dev/null || echo 0)
                if [ "$size" -gt 0 ] && [ "$size" -lt 5242880 ]; then
                    echo ""
                    echo "SUCCESS: $OUTPUT_GIF ($(du -h "$OUTPUT_GIF" | cut -f1))"
                    rm -f "$CAST_FILE" "$EXPECT_SCRIPT"
                    exit 0
                fi
                echo "GIF too large or empty ($size bytes), trying smaller settings..."
                agg --font-size 12 --theme dracula --idle-time-limit 1 --speed 1.5 \
                    --cols 80 --rows 24 "$CAST_FILE" "$OUTPUT_GIF" 2>&1 || true
                size=$(stat -f%z "$OUTPUT_GIF" 2>/dev/null || stat -c%s "$OUTPUT_GIF" 2>/dev/null || echo 0)
                if [ "$size" -gt 0 ] && [ "$size" -lt 5242880 ]; then
                    echo ""
                    echo "SUCCESS: $OUTPUT_GIF ($(du -h "$OUTPUT_GIF" | cut -f1))"
                    rm -f "$CAST_FILE" "$EXPECT_SCRIPT"
                    exit 0
                fi
            fi
        fi
    fi

    rm -f "$CAST_FILE"
    echo "asciinema approach did not produce a valid GIF, falling back..."
fi

# ── Approach 2: Python/Pillow (rendered terminal frames) ───────────
if [ "$has_pillow" = y ]; then
    echo ""
    echo "== Generating demo GIF with Python/Pillow =="

    python3 - "$OUTPUT_GIF" << 'PYEOF'
import sys, os
from PIL import Image, ImageDraw, ImageFont

OUTPUT = sys.argv[1]

C = {
    "bg":      (13, 13, 26),
    "sidebar": (26, 26, 46),
    "border":  (51, 51, 85),
    "sep":     (51, 51, 85),
    "purple":  (124, 92, 252),
    "lpurple": (155, 125, 255),
    "green":   (0, 229, 160),
    "dgreen":  (0, 204, 102),
    "cyan":    (0, 204, 204),
    "gray":    (136, 136, 136),
    "dgray":   (102, 102, 102),
    "ddgray":  (85, 85, 85),
    "lgray":   (204, 204, 204),
    "white":   (255, 255, 255),
    "yellow":  (204, 204, 0),
    "red":     (204, 51, 51),
    "blue":    (74, 159, 216),
    "teal":    (29, 158, 117),
    "orange":  (239, 159, 39),
    "titlebar": (30, 30, 50),
}

COLS = 96
ROWS = 28
PAD = 16
FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 12

font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
bb = font.getbbox("M")
CW = bb[2] - bb[0]
CH = int(font.getbbox("Ay")[3] * 1.65)
BAR_H = 26
IMG_W = COLS * CW + PAD * 2
IMG_H = ROWS * CH + PAD * 2 + BAR_H

def draw_bar(d, w):
    d.rectangle([0, 0, w, BAR_H], fill=C["titlebar"])
    for i, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        cx = 16 + i * 20
        d.ellipse([cx-5, BAR_H//2-5, cx+5, BAR_H//2+5], fill=col)
    title_x = w // 2 - 7 * CW
    d.text((title_x, 5), "SynthCode", fill=C["lgray"], font=font)

def segs(d, row, segments, x_off=0):
    x = PAD + x_off * CW
    y = BAR_H + PAD + row * CH
    for text, color in segments:
        col = C.get(color, C["lgray"])
        d.text((x, y), text, fill=col, font=font)
        x += font.getlength(text)

def line(d, row, text, color="lgray", x_off=0):
    segs(d, row, [(text, color)], x_off)

def sep(d, row, text=" " + "\u2500" * 60, color="sep"):
    line(d, row, text, color)

def blank(d, row):
    line(d, row, "", "bg")

def sidebar_block(d, start_row, width, rows_data):
    x0 = PAD
    y0 = BAR_H + PAD + start_row * CH
    h = len(rows_data) * CH
    d.rectangle([x0, y0, x0 + width * CW, y0 + h], fill=C["sidebar"])
    for i, (text, color) in enumerate(rows_data):
        col = C.get(color, C["lgray"])
        d.text((x0 + CW, y0 + i * CH), text, fill=col, font=font)

def frame():
    img = Image.new("RGB", (IMG_W, IMG_H), C["bg"])
    d = ImageDraw.Draw(img)
    draw_bar(d, IMG_W)
    return img, d

def splash_frame():
    img, d = frame()
    logo = [
        "$$$$$$$\\                       $$\\     $$\\        $$$$$$\\                  $$\\           ",
        "$$  __$$\\                      $$ |    $$ |      $$  __$$\\                 $$ |          ",
        "$$ /  \\__|$$\\   $$\\ $$$$$$$\\ $$$$$$\\   $$$$$$$\\  $$ /  \\__| $$$$$$\\   $$$$$$$ | $$$$$$\\  ",
        "\\$$$$$$\\  $$ |  $$ |$$  __$$\\\\_$$  _|  $$  __$$\\ $$ |      $$  __$$\\ $$  __$$ |$$  __$$\\ ",
        " \\____$$\\ $$ |  $$ |$$ |  $$ | $$ |    $$ |  $$ |$$ |      $$ /  $$ |$$ /  $$ |$$$$$$$$ |",
        "$$\\   $$ |$$ |  $$ |$$ |  $$ | $$ |$$\\ $$ |  $$ |$$ |  $$\\ $$ |  $$ |$$ |  $$ |$$   ____|",
        "\\$$$$$$  |\\$$$$$$$ |$$ |  $$ | \\$$$$  |$$ |  $$ |\\$$$$$$  |\\$$$$$$  |\\$$$$$$$ |\\$$$$$$$\\ ",
        " \\______/  \\____$$ |\\__|  \\__|  \\____/ \\__|  \\__| \\______/  \\______/  \\_______| \\_______|",
        "          $$\\   $$ |                                                                     ",
        "          \\$$$$$$  |                                                                     ",
        "           \\______/                                                                      ",
    ]
    for i, l in enumerate(logo):
        line(d, 3 + i, l, "purple")
    line(d, 15, "Neural Intuition x Symbolic Precision", "lpurple")
    line(d, 17, "Press any key to continue", "dgray")
    return img

def setup_frame():
    img, d = frame()
    line(d, 7, "Model Setup", "white")
    blank(d, 8)
    line(d, 9, "Choose how to connect to a model for inference", "gray")
    blank(d, 10)
    line(d, 11, "  [1] LOCAL MODEL  - Deep system inspection, Ollama SLM", "gray")
    line(d, 12, "> [2] CLOUD MODEL  - Gemini / Groq / OpenRouter / OpenAI", "green")
    blank(d, 13)
    line(d, 14, "Up/Down: navigate  Enter: select", "ddgray")
    return img

def cloud_setup_frame():
    img, d = frame()
    line(d, 5, "Cloud Provider Setup", "white")
    blank(d, 6)
    line(d, 7, "Select a provider and enter your API key", "gray")
    blank(d, 8)
    line(d, 9,  "> Google Gemini     gemini-2.5-flash", "green")
    line(d, 10, "  Groq              llama-3.3-70b-versatile", "gray")
    line(d, 11, "  OpenRouter        anthropic/claude-sonnet-4", "gray")
    line(d, 12, "  OpenAI            gpt-4.1-mini", "gray")
    blank(d, 13)
    line(d, 14, "API Key:", "gray")
    line(d, 15, "  sk-t...abcd", "dgreen")
    blank(d, 16)
    line(d, 17, "Up/Down: provider  Type: paste key  Enter: continue  Esc: back", "ddgray")
    return img

def chat_frame():
    img, d = frame()
    sw = 24
    sr = 0
    sidebar_data = [
        (" SYNTHCODE", "purple"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" Model", "gray"),
        (" gemini-2.5-flash", "lpurple"),
        (" CLOUD", "gray"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" Mode", "gray"),
        (" > Chat", "green"),
        ("   Gate Trace", "ddgray"),
        ("   Code View", "ddgray"),
        ("   World Model", "ddgray"),
        ("   Trust Boundary", "ddgray"),
        ("   Playground", "ddgray"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" ^P palette  ^M models", "ddgray"),
        (" /help for tools", "ddgray"),
    ]
    sidebar_block(d, sr, sw, sidebar_data)

    mx = PAD + sw * CW + CW
    my = BAR_H + PAD
    main_w = (COLS - sw - 2) * CW
    line(d, 1, "Type a message or use tools: /run /read /write /ls /edit /search", "ddgray", sw + 2)

    input_y = BAR_H + PAD + (ROWS - 3) * CH
    d.rectangle([mx, input_y, mx + main_w, input_y + 3 * CH], outline=C["border"], width=1)
    d.text((mx + 4, input_y + CH // 2), "> ", fill=C["cyan"], font=font)
    d.text((mx + 4 + 2 * CW, input_y + CH // 2), "build a snake game\u2588", fill=C["white"], font=font)

    return img

def gate_frame():
    img, d = frame()
    sw = 24
    sidebar_data = [
        (" SYNTHCODE", "purple"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" Model", "gray"),
        (" gemini-2.5-flash", "lpurple"),
        (" CLOUD", "gray"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" Mode", "gray"),
        ("   Chat", "ddgray"),
        (" > Gate Trace", "green"),
        ("   Code View", "ddgray"),
        ("   World Model", "ddgray"),
        ("   Trust Boundary", "ddgray"),
        ("   Playground", "ddgray"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" ^P palette  ^M models", "ddgray"),
        (" /help for tools", "ddgray"),
    ]
    sidebar_block(d, 0, sw, sidebar_data)

    ox = sw + 2
    line(d, 0, " GATE TRACE   session s-042   15 steps", "blue", ox)
    sep(d, 1, " " + "\u2500" * 68, "sep")
    line(d, 2, " \u258C Step                 Neural Output            Gate        Decision   ms  Ret", "ddgray", ox)
    sep(d, 3, " " + "\u2500" * 68, "sep")

    gates = [
        ("plan.parse", "generate token handler", "type_check", "PASS", 4, 0),
        ("plan.validate", "refactor auth middleware", "dep_graph", "VERIFIED", 134, 0),
        ("tool.edit(3)", "add JWT expiry check", "io_boundary", "PASS", 7, 0),
        ("tool.edit(7)", "update imports", "syntax_check", "FAIL-RETRY", 11, 2),
        ("tool.read(1)", "fix type annotation", "assert_gate", "PASS", 3, 0),
        ("tool.edit(12)", "add error boundary", "contract", "VERIFIED", 198, 0),
        ("tool.write(src/auth.ts)", "refactor DB query", "type_check", "PASS", 5, 0),
        ("tool.edit(24)", "add validation", "dep_graph", "FAIL-RETRY", 9, 1),
        ("verify.compile", "fix async await", "io_boundary", "PASS", 2, 0),
        ("verify.test", "add test case", "syntax_check", "PASS", 6, 0),
        ("tool.edit(31)", "update schema", "assert_gate", "FAIL-RETRY", 8, 1),
        ("tool.read(5)", "fix null check", "contract", "VERIFIED", 156, 0),
        ("plan.finalize", "finalize plan", "type_check", "PASS", 3, 0),
        ("tool.edit(44)", "add rate limiter", "dep_graph", "PASS", 5, 0),
        ("verify.lint", "fix lint error", "syntax_check", "PASS", 2, 0),
    ]

    for i, (step, out, gate, dec, ms, ret) in enumerate(gates):
        row = 4 + i
        dec_color = "green" if dec == "PASS" else "yellow" if dec == "VERIFIED" else "red"
        txt = f" \u258C {step:<22s} {out:<24s} {gate:<12s}"
        segs(d, row, [
            (f" \u258C {step:<22s}", "lgray"),
            (f"{out:<24s}", "lgray"),
            (f"{gate:<12s}", "gray"),
            (f"{dec:<11s}", dec_color),
            (f"{ms:>3d}", "ddgray"),
            (f"  {ret}", "ddgray"),
        ], ox)

    sep(d, 4 + len(gates), " " + "\u2500" * 68, "sep")
    total = len(gates)
    passed = sum(1 for g in gates if g[3] != "FAIL-RETRY")
    rate = passed / total * 100
    segs(d, 5 + len(gates), [
        (f" Total: {total}   Pass rate: {rate:.0f}%   Avg latency: 44ms", "gray"),
    ], ox)
    line(d, 6 + len(gates), " R: filter FAIL  C: clear  Enter: animate  Esc: back", "ddgray", ox)
    return img

def code_frame():
    img, d = frame()
    sw = 24
    sidebar_data = [
        (" SYNTHCODE", "purple"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" Model", "gray"),
        (" gemini-2.5-flash", "lpurple"),
        (" CLOUD", "gray"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" Mode", "gray"),
        ("   Chat", "ddgray"),
        ("   Gate Trace", "ddgray"),
        (" > Code View", "green"),
        ("   World Model", "ddgray"),
        ("   Trust Boundary", "ddgray"),
        ("   Playground", "ddgray"),
        (" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", "sep"),
        (" ^P palette  ^M models", "ddgray"),
        (" /help for tools", "ddgray"),
    ]
    sidebar_block(d, 0, sw, sidebar_data)

    ox = sw + 2
    line(d, 0, " CODE   src/auth.ts   +7 \u22126", "blue", ox)
    sep(d, 1, " " + "\u2500" * 68, "sep")

    code_lines = [
        (40, " ", "import { Router } from 'express';", None),
        (41, " ", "import jwt from 'jsonwebtoken';", None),
        (42, "-", "const SECRET = process.env.JWT_SECRET;", None),
        (43, "+", "const SECRET = config.get('jwt.secret');", ("dep_graph", "PASS", "dep: config -> jwt.secret", "3ms")),
        (44, "+", "const EXPIRY = config.get('jwt.expiry') || '1h';", ("assert_gate", "PASS", "assert: EXPIRY is duration", "1ms")),
        (45, " ", "", None),
        (46, "-", "export function authenticate(req, res, next) {", None),
        (47, "+", "export function authenticate(req: Request, res: Response, next: Next) {", ("type_check", "PASS", "types: Express middleware sig", "4ms")),
        (48, " ", "  const token = req.headers.authorization?.split(' ')[1];", None),
        (49, "-", "  const decoded = jwt.verify(token, SECRET);", None),
        (50, "+", "  const decoded = jwt.verify(token, SECRET, { expiresIn: EXPIRY });", ("contract", "FAIL", "constraint: jwt.exp > now()", "142ms")),
        (51, "+", "  if (decoded.exp < Date.now() / 1000) {", ("io_boundary", "PASS", "boundary: time comparison safe", "2ms")),
        (52, "+", "    throw new TokenExpiredError(decoded.exp);", ("type_check", "PASS", "types: Error subclass", "3ms")),
        (53, " ", "  }", None),
        (54, " ", "  req.user = decoded;", None),
        (55, "-", "  next();", None),
        (56, "+", "  next();", ("dep_graph", "PASS", "flow: auth -> next handler", "5ms")),
        (57, " ", "}", None),
    ]

    for i, (ln, kind, content, ann) in enumerate(code_lines):
        row = 2 + i
        if kind == "+":
            lc = "dgreen"
        elif kind == "-":
            lc = "red"
        else:
            lc = "lgray"

        segs(d, row, [
            (f" {ln:>3d} ", "ddgray"),
            (kind, lc),
            (f" {content}", lc),
        ], ox)

        if ann:
            gate, result, detail, latency = ann
            rc = "dgreen" if result == "PASS" else "red"
            ann_text = f"  [{gate}:{result}] {detail} ({latency})"
            line(d, row, ann_text, rc, ox + 56)

    line(d, 2 + len(code_lines) + 1, " Up/Down: navigate  Esc: back", "ddgray", ox)
    return img

# Generate frames with durations
frame_data = [
    (splash_frame(),     2000),
    (setup_frame(),      1500),
    (cloud_setup_frame(), 1500),
    (chat_frame(),       2000),
    (gate_frame(),       2500),
    (code_frame(),       2500),
]

# Build GIF frames at ~20fps
fps = 20
gif_frames = []
for img, duration_ms in frame_data:
    n = max(1, round(duration_ms / (1000 / fps)))
    for _ in range(n):
        gif_frames.append(img)

# Also add duplicate of last frame held for 2s
last = frame_data[-1][0]
for _ in range(fps * 2):
    gif_frames.append(last)

print(f"Rendering {len(gif_frames)} frames at {fps}fps...")

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
gif_frames[0].save(
    OUTPUT,
    save_all=True,
    append_images=gif_frames[1:],
    duration=int(1000 / fps),
    loop=0,
    optimize=True,
)

size = os.path.getsize(OUTPUT)
print(f"Written: {OUTPUT} ({size / 1024 / 1024:.1f} MB)")

if size > 5 * 1024 * 1024:
    print("Optimizing: reducing colors...")
    from PIL import ImageOps
    optimized = []
    palette = gif_frames[0].quantize(colors=128, method=Image.Quantize.MEDIANCUT)
    for f in gif_frames:
        q = f.quantize(colors=128, method=Image.Quantize.MEDIANCUT, palette=palette)
        optimized.append(q.convert("RGB"))
    optimized[0].save(
        OUTPUT,
        save_all=True,
        append_images=optimized[1:],
        duration=int(1000 / fps),
        loop=0,
        optimize=True,
    )
    size = os.path.getsize(OUTPUT)
    print(f"Optimized: {OUTPUT} ({size / 1024 / 1024:.1f} MB)")

if size < 5 * 1024 * 1024:
    print(f"\nSUCCESS: {OUTPUT}")
    print(f"Size: {size / 1024 / 1024:.2f} MB")
else:
    print(f"\nWARNING: GIF is large ({size / 1024 / 1024:.2f} MB)")
    sys.exit(1)
PYEOF

    if [ -f "$OUTPUT_GIF" ]; then
        rm -f "$EXPECT_SCRIPT"
        echo ""
        echo "SUCCESS: $OUTPUT_GIF ($(du -h "$OUTPUT_GIF" | cut -f1))"
        exit 0
    fi
fi

echo "ERROR: Could not generate demo GIF (no suitable tools found)"
exit 1
