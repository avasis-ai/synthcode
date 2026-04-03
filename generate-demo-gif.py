import os
import sys

os.chdir("/tmp/gif-run")
sys.path.insert(0, "/tmp/gif-run")

import gifos

t = gifos.Terminal(width=700, height=440, xpad=12, ypad=10)

t.set_prompt("\x1b[91mdev\x1b[0m@\x1b[93mproject\x1b[0m ~/todo-app ~> ")

t.gen_text("\x1b[90m$ npx @avasis-ai/synth init\x1b[0m", row_num=1)
t.clone_frame(5)
t.gen_text("\x1b[32msynth\x1b[0m v0.4.0 initialized", row_num=2)
t.gen_text("\x1b[90m  6 tools loaded | 0 dependencies | ESM + CJS\x1b[0m", row_num=3)
t.clone_frame(8)

t.gen_prompt(row_num=4)
t.gen_typing_text(
    'synth run "Build a REST API with Express"', row_num=4, contin=True, speed=1
)
t.clone_frame(6)

t.gen_text("", row_num=5)
t.gen_text("\x1b[36m  agent\x1b[0m \x1b[90mthinking...\x1b[0m", row_num=6)
t.clone_frame(10)
t.gen_text(
    "\x1b[36m  agent\x1b[0m \x1b[32mwriting\x1b[0m \x1b[90msrc/server.ts\x1b[0m",
    row_num=7,
)
t.clone_frame(8)
t.gen_text(
    "\x1b[36m  agent\x1b[0m \x1b[32mwriting\x1b[0m \x1b[90msrc/routes.ts\x1b[0m",
    row_num=8,
)
t.clone_frame(8)
t.gen_text(
    "\x1b[36m  agent\x1b[0m \x1b[33mtool\x1b[0m   \x1b[90mbash\x1b[0m \x1b[60mnpm install express zod\x1b[0m",
    row_num=9,
)
t.clone_frame(10)
t.gen_text(
    "\x1b[36m  agent\x1b[0m \x1b[33mtool\x1b[0m   \x1b[90mbash\x1b[0m \x1b[60mnpx tsc --noEmit\x1b[0m",
    row_num=10,
)
t.clone_frame(8)
t.gen_text(
    "\x1b[36m  agent\x1b[0m \x1b[33mtool\x1b[0m   \x1b[90mbash\x1b[0m \x1b[60mnpm test\x1b[0m",
    row_num=11,
)
t.clone_frame(10)

t.gen_text("", row_num=12)
t.gen_text(
    "\x1b[32m  Done.\x1b[0m \x1b[90m4 files | 12 tests passing | 0 errors\x1b[0m",
    row_num=13,
)
t.clone_frame(40)

t.gen_gif()
print("GIF generated: docs/demo.gif")
