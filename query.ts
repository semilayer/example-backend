/**
 * SemiLayer — minimal backend query example.
 *
 * Runs a structured `query()` against a lens and prints the rows, then
 * (if invoked as `pnpm search "<term>"`) runs a semantic search.
 *
 * Usage:
 *   pnpm query                      # structured query: newest 10 rows
 *   pnpm search "weeknight dinner"  # semantic search
 */
import { BeamClient } from '@semilayer/client'

const baseUrl = process.env.SEMILAYER_URL ?? 'http://localhost:3001'
const apiKey = process.env.SEMILAYER_KEY ?? ''
const lens = process.env.SEMILAYER_LENS ?? 'recipes'

if (!apiKey) {
  console.error('Missing SEMILAYER_KEY. Copy .env.example → .env and fill it in.')
  process.exit(1)
}

const beam = new BeamClient({ baseUrl, apiKey })

const [cmd, ...rest] = process.argv.slice(2)

async function main() {
  if (cmd === 'search') {
    const query = rest.join(' ').trim()
    if (!query) {
      console.error('Usage: pnpm search "<natural language query>"')
      process.exit(1)
    }
    const res = await beam.search(lens, { query, limit: 10 })
    console.log(`\n${res.meta.count} results in ${res.meta.durationMs}ms\n`)
    for (const r of res.results) {
      console.log(`[${(r.score * 100).toFixed(0)}%]`, r.metadata)
    }
    return
  }

  // Default: structured query — newest 10 rows, no embedding involved.
  // Edit `where` / `orderBy` / `limit` / `select` for your own schema.
  const res = await beam.query<Record<string, unknown>>(lens, {
    limit: 10,
    orderBy: { field: 'id', dir: 'desc' },
  })
  console.log(`\n${res.meta.count} rows in ${res.meta.durationMs}ms\n`)
  for (const row of res.rows) {
    console.log(row)
  }
}

main().catch((err) => {
  console.error(err);
  console.error('query failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
