// 本地对照：用同一批虚构案例和线上同一份提示词，比较不同模型生成的职业评估报告。
// 不连接 Supabase，不写入任何线上数据。结果写入 scripts/model-compare/results/（已加入 .gitignore）。
//
// 用法：
//   npm run compare:career-report -- --dry-run
//   npm run compare:career-report -- --providers=qwen,deepseek --cases=fluent-english-no-sales
//
// 每个模型只在配置了密钥时运行：
//   qwen / qwen-max / deepseek  DASHSCOPE_API_KEY（可用 COMPARE_QWEN_MAX_MODEL、COMPARE_DEEPSEEK_MODEL 改型号）
//   openai                      OPENAI_API_KEY + COMPARE_OPENAI_MODEL（可选 OPENAI_BASE_URL）
//   claude                      ANTHROPIC_API_KEY（可选 COMPARE_CLAUDE_MODEL、COMPARE_CLAUDE_EFFORT）

import Anthropic from '@anthropic-ai/sdk'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { allowedRoles, buildCareerReportMessages, sanitizeProfile } from '../../server/careerReport.js'
import { careerReportCases } from './career-report-cases.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const env = process.env
const REQUEST_TIMEOUT_MS = 180_000
const dashscopeBaseUrl = (env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '')

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
  return [key, value]
}))
const pickList = (value) => value && value !== 'true' ? value.split(',').map((item) => item.trim()).filter(Boolean) : null

const callChatCompletions = async ({ baseUrl, apiKey, body }) => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const raw = await response.text()
  let parsed
  try { parsed = JSON.parse(raw) } catch { parsed = null }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${(parsed?.error?.message || parsed?.message || raw).slice(0, 300)}`)
  return {
    text: parsed?.choices?.[0]?.message?.content || '',
    usage: { input: parsed?.usage?.prompt_tokens, output: parsed?.usage?.completion_tokens },
    finishReason: parsed?.choices?.[0]?.finish_reason,
    servedModel: parsed?.model,
  }
}

// 线上上限 2500 tokens；对照模型可能自带思考，给 8000 避免被截断。
const dashscopeProvider = (name, model, extra = {}, maxTokens = 8000) => ({
  name,
  model,
  enabled: Boolean(env.DASHSCOPE_API_KEY),
  missing: 'DASHSCOPE_API_KEY',
  run: (messages) => callChatCompletions({
    baseUrl: dashscopeBaseUrl,
    apiKey: env.DASHSCOPE_API_KEY,
    body: { model, temperature: 0.2, max_completion_tokens: maxTokens, response_format: { type: 'json_object' }, messages, ...extra },
  }),
})

let anthropicClient
const claudeModel = env.COMPARE_CLAUDE_MODEL || 'claude-opus-5-5'
const claudeEffort = env.COMPARE_CLAUDE_EFFORT || 'high'

const providers = [
  // 与线上一致：同一模型、同样参数。
  dashscopeProvider('qwen', env.DASHSCOPE_CAREER_REPORT_MODEL || env.DASHSCOPE_EVALUATION_MODEL || 'qwen3.5-plus', { enable_thinking: false }, 2500),
  dashscopeProvider('qwen-max', env.COMPARE_QWEN_MAX_MODEL || 'qwen3.8-max', { enable_thinking: false }),
  dashscopeProvider('deepseek', env.COMPARE_DEEPSEEK_MODEL || 'deepseek-v4-pro'),
  {
    name: 'openai',
    model: env.COMPARE_OPENAI_MODEL || '',
    enabled: Boolean(env.OPENAI_API_KEY && env.COMPARE_OPENAI_MODEL),
    missing: 'OPENAI_API_KEY 和 COMPARE_OPENAI_MODEL',
    run: (messages) => callChatCompletions({
      baseUrl: (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
      apiKey: env.OPENAI_API_KEY,
      // 推理模型会把思考也算进 max_completion_tokens，所以给得比线上宽；部分型号不支持 temperature，这里不传。
      body: { model: env.COMPARE_OPENAI_MODEL, max_completion_tokens: 16000, response_format: { type: 'json_object' }, messages },
    }),
  },
  {
    name: 'claude',
    model: `${claudeModel} (effort ${claudeEffort})`,
    enabled: Boolean(env.ANTHROPIC_API_KEY),
    missing: 'ANTHROPIC_API_KEY',
    run: async ([system, user]) => {
      anthropicClient ||= new Anthropic({ timeout: REQUEST_TIMEOUT_MS })
      const response = await anthropicClient.beta.messages.create({
        model: claudeModel,
        max_tokens: 16000,
        output_config: { effort: claudeEffort },
        // 被安全分类器拒答时由服务端自动换模型重试；fallbackModel 会记录实际服务的模型。
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: system.content,
        messages: [{ role: 'user', content: user.content }],
      })
      if (response.stop_reason === 'refusal') throw new Error(`refusal: ${response.stop_details?.category || 'unknown'}`)
      return {
        text: response.content.filter((block) => block.type === 'text').map((block) => block.text).join(''),
        usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
        finishReason: response.stop_reason,
        servedModel: response.model,
      }
    },
  },
]

const parseReportJson = (text) => {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  try { return JSON.parse(cleaned) } catch { /* 再尝试截取第一个对象 */ }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  try { return start >= 0 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : null } catch { return null }
}

const roleIds = allowedRoles.map((role) => role.id)
const routeIds = ['diy', 'guide', 'agent', 'undecided', 'pause']
const basisKeys =['english', 'experience', 'entry_threshold', 'competitiveness', 'core_goal']
const forbiddenPhrases = ['你最适合', '你应该直接申请', '就是你的最佳选择']

// 只检查格式和提示词里的硬性要求；判断质量留给人工按 expect 打分。
const checkReport = (report) => {
  const issues = []
  if (!report?.summary) issues.push('缺少 summary')
  const positions = Array.isArray(report?.recommendedPositions) ? report.recommendedPositions : []
  const ids = positions.map((item) => item?.id)
  if (new Set(ids).size !== 3) issues.push(`推荐岗位不是 3 个不同岗位（${ids.join(', ') || '无'}）`)
  const invalid = ids.filter((id) => !roleIds.includes(id))
  if (invalid.length) issues.push(`岗位不在允许列表：${invalid.join(', ')}`)
  const keys = Array.isArray(report?.decisionBasis) ? report.decisionBasis.map((item) => item?.key) : []
  const missingKeys = basisKeys.filter((key) => !keys.includes(key))
  if (missingKeys.length) issues.push(`decisionBasis 缺少：${missingKeys.join(', ')}`)
  const scores = positions.map((item) => Number(item?.matchScore) || 0)
  if (scores.some((score, index) => index > 0 && score > scores[index - 1])) issues.push(`岗位未按分数排序（${scores.join(' > ')}）`)
  const amounts = JSON.stringify(report || {}).match(/\d[\d,]*\s*(?:[-–~至]\s*\d[\d,]*\s*)?(?:美金|美元|USD|刀)/gi)
  if (amounts) issues.push(`出现具体金额：${[...new Set(amounts)].join('、')}`)
  if (!routeIds.includes(report?.applicationRoute?.id)) issues.push(`申请路线无效：${report?.applicationRoute?.id || '缺失'}`)
  const usedPhrases = forbiddenPhrases.filter((phrase) => JSON.stringify(report || {}).includes(phrase))
  if (usedPhrases.length) issues.push(`使用了禁用表达：${usedPhrases.join('、')}`)
  return issues
}

const list = (items) => Array.isArray(items) && items.length ? items.map((item) => `  - ${item}`).join('\n') : '  - （无）'

const renderResult = (result) => {
  const head = `#### ${result.provider} · ${result.model}\n\n`
  if (result.error) return `${head}**失败**：${result.error}（${result.latencyMs} ms）\n`
  const report = result.report
  const signals = report?.advisorSignals || {}
  const positions = (report?.recommendedPositions || []).map((item, index) => (
    `  ${index + 1}. **${item?.id}** ${item?.matchScore ?? '?'} 分\n     - 理由：${(item?.reasons || []).join('；')}\n     - 风险：${(item?.risks || []).join('；')}`
  )).join('\n')
  return `${head}${result.latencyMs} ms · 输入 ${result.usage?.input ?? '?'} / 输出 ${result.usage?.output ?? '?'} tokens${result.servedModel ? ` · 实际模型 ${result.servedModel}` : ''}${result.finishReason ? ` · 结束原因 ${result.finishReason}` : ''}

- 格式检查：${result.issues.length ? result.issues.join('；') : '通过'}
- 总结：${report?.summary || ''}
- 推荐岗位：
${positions}
- 决策风险：
${list(report?.decisionRisks)}
- 人工校准：${report?.manualCalibration?.recommended === true ? `建议（${(report.manualCalibration.topics || []).join('、')}）` : '不建议'}
- 申请路线：${report?.applicationRoute?.id || '（缺失）'} · ${report?.applicationRoute?.reason || ''}
- 不建议：
${list(report?.notRecommended)}
- 30 天计划：
${list(report?.next30Days)}
- 置信度：${signals.confidence || '?'} · 风险标签：${(signals.riskFlags || []).join(', ') || '无'}
- 待补信息：${(signals.missingInformation || []).join('；') || '无'}
`
}

const runOne = async (provider, messages) => {
  const startedAt = Date.now()
  try {
    const output = await provider.run(messages)
    const report = parseReportJson(output.text)
    const invalid = [`返回内容不是有效 JSON（结束原因 ${output.finishReason || '未知'}）`]
    return { ...output, report, issues: report ? checkReport(report) : invalid, latencyMs: Date.now() - startedAt }
  } catch (error) {
    return { error: error?.message || String(error), latencyMs: Date.now() - startedAt }
  }
}

const selectedProviders = pickList(args.providers)
const selectedCases = pickList(args.cases)
const activeProviders = providers.filter((provider) => !selectedProviders || selectedProviders.includes(provider.name))
const cases = careerReportCases.filter((item) => !selectedCases || selectedCases.includes(item.id))

for (const provider of activeProviders) {
  console.log(`${provider.enabled ? '✓' : '·'} ${provider.name.padEnd(9)} ${provider.enabled ? provider.model : `跳过：缺少 ${provider.missing}`}`)
}
const runnable = activeProviders.filter((provider) => provider.enabled)
console.log(`案例 ${cases.length} 个，将发起 ${cases.length * runnable.length} 次调用。`)

if (args['dry-run']) {
  const sample = buildCareerReportMessages({ profile: sanitizeProfile(cases[0].profile), assessment: cases[0].assessment, fallbackRecommendations: cases[0].assessment.ruleRecommendations })
  console.log(`示例案例 ${cases[0].id}：system ${sample[0].content.length} 字，user ${sample[1].content.length} 字。--dry-run 未调用任何模型。`)
  process.exit(0)
}
if (!runnable.length || !cases.length) {
  console.error('没有可运行的模型或案例。')
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = path.join(here, 'results', stamp)
await mkdir(path.join(outDir, 'raw'), { recursive: true })

const sections = []
for (const testCase of cases) {
  const messages = buildCareerReportMessages({
    profile: sanitizeProfile(testCase.profile),
    assessment: testCase.assessment,
    fallbackRecommendations: testCase.assessment.ruleRecommendations,
  })
  console.log(`→ ${testCase.id}`)
  const results = await Promise.all(runnable.map(async (provider) => {
    const result = { provider: provider.name, model: provider.model, ...(await runOne(provider, messages)) }
    await writeFile(path.join(outDir, 'raw', `${testCase.id}__${provider.name}.json`), JSON.stringify(result, null, 2))
    console.log(`   ${provider.name.padEnd(9)} ${result.error ? `失败 ${result.error.slice(0, 80)}` : `${result.latencyMs} ms，${result.issues.length ? `${result.issues.length} 项格式问题` : '格式通过'}`}`)
    return result
  }))
  sections.push({ testCase, results })
}

const header = `| 案例 | ${runnable.map((provider) => provider.name).join(' | ')} |\n| --- | ${runnable.map(() => '---').join(' | ')} |`
const scoreRows = sections.map(({ testCase }) => `| ${testCase.title} | ${runnable.map(() => ' ').join(' | ')} |`).join('\n')
const markdown = `# 职业评估模型对照 ${stamp}

提示词与线上 \`server/careerReport.js\` 完全一致，案例均为虚构。下面展示的是模型原始输出，未经过线上的规则补全。

## 打分表（人工填写，每格 0-3 分）

评分时只看对照要点：是否发现冲突、是否引用证据、是否承认信息不足、建议是否可执行。不看文字是否漂亮。

${header}
${scoreRows}

${sections.map(({ testCase, results }) => `## ${testCase.title}

\`${testCase.id}\` · 对照要点：
${list(testCase.expect)}

${results.map(renderResult).join('\n')}`).join('\n---\n\n')}
`

await writeFile(path.join(outDir, 'report.md'), markdown)
console.log(`\n报告：${path.relative(process.cwd(), path.join(outDir, 'report.md'))}`)
