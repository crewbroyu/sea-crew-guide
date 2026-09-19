import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [server, client, sql, barCourse, retailCourse] = await Promise.all([
  read('server/tts.js'),
  read('src/services/ttsService.js'),
  read('supabase_voice_entitlements.sql'),
  read('src/components/training/BarServerFoundationTraining.jsx'),
  read('src/components/training/RetailFoundationTraining.jsx'),
])

const checks = [
  ['server maps Bar Server to its own pack', server.includes("['bar_server', 'bar_server_pack']")],
  ['server maps Retail to its own pack', server.includes("['retail', 'retail_sales_pack']")],
  ['server validates active entitlements', server.includes(".from('user_entitlements')")],
  ['server reserves TTS quota before provider use', server.includes("input_action: 'tts'")],
  ['server releases failed provider reservations', server.includes("outcome: 'released'")],
  ['client falls back to browser speech', client.includes('speakWithBrowser(normalizedText, options)')],
  ['client sends a unique request id', client.includes('clientRequestId: createRequestId()')],
  ['database applies a daily TTS limit of 60', sql.includes('when is_tts then 60')],
  ['database applies one TTS limit across owned packs', sql.includes("'all-products:tts'") && sql.includes('(is_tts or product_code = input_product_code)')],
  ['database uses the Shanghai calendar day', sql.includes("time zone 'Asia/Shanghai'")],
  ['database gives free users three lifetime ASR conversions', sql.includes("when input_action = 'transcribe' then 3")],
  ['Bar course supplies Bar Server context', barCourse.includes("position=\"bar_server\"")],
  ['Retail course supplies Retail context', retailCourse.includes("position=\"retail\"")],
]

const failed = checks.filter(([, passed]) => !passed)
if (failed.length) {
  for (const [label] of failed) console.error(`FAIL: ${label}`)
  process.exit(1)
}

for (const [label] of checks) console.log(`PASS: ${label}`)
