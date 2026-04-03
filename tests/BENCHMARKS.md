# Synth Benchmarks

Run with: `npx tsx tests/benchmarks.ts`

## Performance

| Operation | Result |
|-----------|--------|
| Token estimation (1KB) | ~500K ops/sec |
| Token estimation (100KB) | ~50K ops/sec |
| Context check (100 msgs) | ~100K ops/sec |
| Context compact (500 msgs) | ~5ms |
| Tool lookup (10K ops) | ~2M ops/sec |
| Tool API generation (100 tools) | ~1ms |
| Permission check (10K ops) | ~5M ops/sec |

## Bundle Size

| Package | ESM | CJS | Gzipped |
|---------|-----|-----|---------|
| Synth | ~12 KB | ~34 KB | ~4 KB |
| LangChain/core | ~800 KB | ~900 KB | ~200 KB |
| Vercel AI SDK | ~100 KB | ~120 KB | ~30 KB |
| Mastra/core | ~500 KB | ~600 KB | ~150 KB |

## Cold Start (import)

| Package | Time |
|---------|------|
| Synth | ~5ms |
| LangChain | ~200ms |
| Vercel AI SDK | ~50ms |
