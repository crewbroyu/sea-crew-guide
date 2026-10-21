import process from 'node:process'
import { PRICING, costCny } from './providers.mjs'

// Usage-based TTS cost comparison. No API calls.
//   npm run bench:tts-cost -- --plays=10000 --chars=80 --hit=0.3
// plays: monthly playback requests; chars: average billable characters per played text;
// hit: share of plays served from a cache (no provider call, no charge).
// Take plays from production with: select date_trunc('month', created_at), count(*)
//   from public.ai_usage_events where action = 'tts' group by 1 order by 1;
// (those rows are provider calls only, so they already exclude today's server-cache hits).

const arg = (name, fallback) => Number(process.argv.find((item) => item.startsWith(`--${name}=`))?.split('=')[1] ?? fallback)
const chars = arg('chars', 80)
const hit = Math.min(1, Math.max(0, arg('hit', 0)))
const scenarios = process.argv.some((item) => item.startsWith('--plays=')) ? [arg('plays', 0)] : [1000, 10000, 50000]

console.log(`Average ${chars} billable chars per play, cache hit ${(hit * 100).toFixed(0)}%, USD/CNY ${PRICING.usdToCny}`)
console.log('plays/month   billed chars   Qwen CNY   Azure CNY (S0)   Azure USD')
for (const plays of scenarios) {
  const billed = plays * (1 - hit) * chars
  console.log([
    String(plays).padStart(11),
    String(Math.round(billed)).padStart(14),
    costCny('qwen', billed).toFixed(2).padStart(10),
    costCny('azure', billed).toFixed(2).padStart(16),
    (billed / 1e6 * PRICING.azureUsdPerMillion).toFixed(2).padStart(11),
  ].join(' '))
}
console.log('\nAzure F0 (0.5M chars/month free) is capped at 20 requests per 60 s, so it is for testing only.')
