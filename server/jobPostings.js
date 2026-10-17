import { createClient } from '@supabase/supabase-js'
import process from 'node:process'
import { JOB_DEPARTMENTS } from '../src/data/jobDepartments.js'
import {
  MAX_POSITIONS,
  normalizeCruiseLines,
  normalizeInterviewSessions,
  normalizePositionDetails,
} from '../src/data/jobPostingDetails.js'

// Admin-only: fetch a public recruitment article and extract draft fields for review.
// Nothing is written here; the admin saves the reviewed draft through RLS.

const DEFAULT_TEXT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = 'qwen3.5-plus'
const MAX_ARTICLE_CHARS = 20000
const ALLOWED_SOURCE_HOSTS = ['mp.weixin.qq.com']


class JobPostingApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

const trimText = (value, maxLength = 2000) => typeof value === 'string' ? value.trim().slice(0, maxLength) : ''

const getHeader = (headers, name) => {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  const target = name.toLowerCase()
  return Object.entries(headers).find(([key]) => key.toLowerCase() === target)?.[1] || ''
}

const getConfig = (env = process.env) => ({
  apiKey: trimText(env.DASHSCOPE_API_KEY, 500),
  textBaseUrl: (env.DASHSCOPE_BASE_URL || DEFAULT_TEXT_BASE_URL).replace(/\/+$/, ''),
  model: trimText(env.DASHSCOPE_JOB_POSTING_MODEL, 100) || trimText(env.DASHSCOPE_EVALUATION_MODEL, 100) || DEFAULT_MODEL,
  supabaseUrl: trimText(env.SUPABASE_URL || env.VITE_SUPABASE_URL, 500),
  supabaseAnonKey: trimText(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY, 1000),
})

const requireAdministrator = async ({ headers, config }) => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new JobPostingApiError(503, 'AUTH_NOT_CONFIGURED', '登录验证服务尚未配置。')
  const token = getHeader(headers, 'authorization').match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token) throw new JobPostingApiError(401, 'LOGIN_REQUIRED', '请先登录管理员账号。')

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user?.id) throw new JobPostingApiError(401, 'LOGIN_REQUIRED', '登录状态已失效，请重新登录。')

  const { data: access } = await supabase
    .from('user_access')
    .select('role, access_status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (access?.role !== 'admin' || access?.access_status !== 'active') {
    throw new JobPostingApiError(403, 'ADMIN_REQUIRED', '仅管理员可以整理招聘信息。')
  }
}

export const normalizeSourceUrl = (value) => {
  let url
  try { url = new URL(trimText(value, 1000)) } catch { return null }
  if (url.protocol !== 'https:' || !ALLOWED_SOURCE_HOSTS.includes(url.hostname)) return null
  url.hash = ''
  // Short links (/s/<id>) are canonical; drop tracking parameters from them.
  if (/^\/s\/[\w-]+$/.test(url.pathname)) url.search = ''
  return url.toString()
}

const decodeEntities = (text) => text
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&amp;/g, '&')

const htmlToText = (html) => decodeEntities(html
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|section|li|h[1-6])>/gi, '\n')
  .replace(/<[^>]+>/g, ''))
  .replace(/[^\S\n]+/g, ' ')
  .replace(/\n\s*\n+/g, '\n')
  .trim()

const matchScriptVar = (html, name) => html.match(new RegExp(`var\\s+${name}\\s*=\\s*["']([^"']*)["']`))?.[1]
  || html.match(new RegExp(`${name}\\s*[:=]\\s*["']([^"']*)["']`))?.[1]
  || ''

export const parseWechatArticle = (html) => {
  const metaTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1] || ''
  const title = trimText(decodeEntities(metaTitle || matchScriptVar(html, 'msg_title')), 120)
  const sourceName = trimText(decodeEntities(matchScriptVar(html, 'nickname')
    || html.match(/id="js_name"[^>]*>([\s\S]*?)</)?.[1] || ''), 80)
  const timestamp = Number(matchScriptVar(html, 'ct'))
  const publishedOn = Number.isFinite(timestamp) && timestamp > 1_000_000_000
    ? new Date(timestamp * 1000).toISOString().slice(0, 10)
    : null
  const contentHtml = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>\s*(?:<script|<div[^>]+(?:js_pc_qr_code|rich_media_tool|js_tags))/i)?.[1]
    || html.match(/id="js_content"[^>]*>([\s\S]*)/i)?.[1]
    || ''
  const text = htmlToText(contentHtml)
  return { title, sourceName, publishedOn, text: text.slice(0, MAX_ARTICLE_CHARS), textTruncated: text.length > MAX_ARTICLE_CHARS }
}

const fetchArticle = async (sourceUrl) => {
  let response
  try {
    response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new JobPostingApiError(502, 'SOURCE_FETCH_FAILED', '无法打开原文，请把正文粘贴到文本框后重试。')
  }
  if (!response.ok) throw new JobPostingApiError(502, 'SOURCE_FETCH_FAILED', '无法打开原文，请把正文粘贴到文本框后重试。')
  const article = parseWechatArticle((await response.text()).slice(0, 3_000_000))
  if (article.text.length < 80) {
    throw new JobPostingApiError(422, 'SOURCE_BLOCKED', '原文需要验证或已被删除，请把正文粘贴到文本框后重试。')
  }
  return article
}

const SYSTEM_PROMPT = `你是邮轮海乘招聘信息整理员。根据用户给的招聘推文正文，只提取原文中明确写出的信息，不要编造。
输出 JSON 对象，字段：
- title: 简洁标题，不超过 40 字，格式如"某邮轮 某岗位 招聘"
- summary: 不超过 150 字的客观摘要，说明谁在招、招什么、面试安排
- cruise_lines: 邮轮公司英文名数组（如 "Royal Caribbean"、"MSC Cruises"），原文没写则为空数组
- departments: 从以下取值中选择的数组：${JOB_DEPARTMENTS.join('、')}
- position_details: 原文列出的每个具体岗位，数组，最多 ${MAX_POSITIONS} 个，每项 {"title": 岗位名（保留原文写法）, "experience": 经验要求}。experience 只依据原文对该岗位的明确要求：
  - "none"：原文明确写了该岗位无需经验、零经验或接受应届生
  - "related"：原文要求相关工作经验（如酒店、餐饮经验），但没有要求邮轮经验
  - "cruise"：原文要求邮轮或船上工作经验
  - "unspecified"：原文没有写明。不要因为是基础岗位就推断为 "none"；"无需邮轮经验"不等于"无需相关工作经验"
  如果某条要求明确适用于全部岗位，就给全部岗位标上；只适用于部分岗位的，只标那些岗位
- positions_incomplete: 原文岗位是否没有完整列出（例如用"等岗位"省略、岗位表是图片、或超过 ${MAX_POSITIONS} 个），布尔值
- interview_sessions: 每一场面试一项，数组，每项 {"city": 城市名（中文，如"上海"），线上面试没有城市则为 null, "mode": "offline" 线下 / "online" 线上 / "unspecified" 未说明, "date": 面试日期 YYYY-MM-DD，原文没写具体日期则为 null, "note": 原文中关于该场的补充（如具体地址、时间段），没有则为 null}。不同城市或方式要分成不同的场次。原文没写年份时，按文章发布日期推断最近的那一天
- agency: 发布或代理招聘的机构名称，没有则为 null
- locations: 面试或报名地点的原文概括，不超过 60 字，没有则为 null
- requirements: 年龄、学历、英语、经验等要求，不超过 200 字，没有则为 null
- salary: 薪资描述，没有则为 null
- deadline: 只填原文明确写出的报名截止日期，YYYY-MM-DD 格式。面试日期不要填在这里，写进 interview_sessions；原文没写报名截止就为 null
- risk_flags: 风险提示数组，例如原文要求先交培训费、押金、服务费，承诺"包过""保录取"，或缺少机构名称；没有则为空数组
- is_recruitment: 原文是否是邮轮或船上岗位招聘信息（布尔值）`

const textOrNull = (value, max) => trimText(value, max) || null
const textList = (value, max, itemMax = 60) => Array.isArray(value)
  ? [...new Set(value.map((item) => trimText(item, itemMax)).filter(Boolean))].slice(0, max)
  : []

export const sanitizeExtraction = (raw = {}, article = {}) => {
  const deadline = trimText(raw.deadline, 10)
  // Older prompts returned a plain positions list; accept it as positions with unspecified experience.
  const positions = normalizePositionDetails(Array.isArray(raw.position_details) ? raw.position_details : raw.positions)
  return {
    title: trimText(raw.title, 120) || article.title || '',
    summary: trimText(raw.summary, 400),
    cruise_lines: normalizeCruiseLines(raw.cruise_lines),
    departments: textList(raw.departments, 10).filter((item) => JOB_DEPARTMENTS.includes(item)),
    position_details: positions.details,
    positions: positions.details.map((item) => item.title),
    interview_sessions: normalizeInterviewSessions(raw.interview_sessions),
    extraction_warnings: [
      ...(positions.truncated ? [`原文岗位超过 ${MAX_POSITIONS} 个，只保留了前 ${MAX_POSITIONS} 个，请核对。`] : []),
      ...(raw.positions_incomplete === true ? ['原文岗位可能没有完整列出（例如"等岗位"或岗位表是图片），请对照原文补充。'] : []),
      ...(article.textTruncated ? ['原文过长，只读取了前面部分，后面的岗位或面试安排可能漏掉，请对照原文核对。'] : []),
    ],
    agency: textOrNull(raw.agency, 120),
    locations: textOrNull(raw.locations, 200),
    requirements: textOrNull(raw.requirements, 800),
    salary: textOrNull(raw.salary, 200),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(deadline) && !Number.isNaN(Date.parse(deadline)) ? deadline : null,
    risk_flags: textList(raw.risk_flags, 10, 120),
    is_recruitment: raw.is_recruitment !== false,
  }
}

const extractWithAi = async ({ config, article }) => {
  if (!config.apiKey) throw new JobPostingApiError(503, 'AI_NOT_CONFIGURED', 'AI 提取服务尚未配置。')
  const response = await fetch(`${config.textBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      enable_thinking: false,
      temperature: 0.1,
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `标题：${article.title || '（无）'}\n发布账号：${article.sourceName || '（无）'}\n文章发布日期：${article.publishedOn || '未知'}\n正文：\n${article.text}` },
      ],
    }),
    signal: AbortSignal.timeout(55_000),
  })
  const raw = await response.text()
  if (!response.ok) {
    console.error('Job posting provider failed:', response.status, raw.slice(0, 300))
    throw new JobPostingApiError(502, 'AI_PROVIDER_ERROR', 'AI 提取暂时不可用，请稍后重试。')
  }
  try {
    return JSON.parse(JSON.parse(raw).choices?.[0]?.message?.content)
  } catch {
    throw new JobPostingApiError(502, 'INVALID_AI_RESPONSE', 'AI 提取结果不完整，请重试。')
  }
}

export async function handleJobPostingRequest({ method, headers, body, env }) {
  try {
    if (method !== 'POST') throw new JobPostingApiError(405, 'METHOD_NOT_ALLOWED', '请求方式无效。')
    const config = getConfig(env)
    await requireAdministrator({ headers, config })

    const sourceUrl = normalizeSourceUrl(body?.sourceUrl)
    if (!sourceUrl) throw new JobPostingApiError(400, 'INVALID_SOURCE_URL', '请输入 https://mp.weixin.qq.com/ 开头的公众号文章链接。')

    const pastedText = trimText(body?.articleText, MAX_ARTICLE_CHARS)
    const article = pastedText.length >= 80
      ? { title: '', sourceName: '', publishedOn: null, text: pastedText, textTruncated: String(body?.articleText || '').trim().length > MAX_ARTICLE_CHARS }
      : await fetchArticle(sourceUrl)

    const extraction = sanitizeExtraction(await extractWithAi({ config, article }), article)
    return {
      status: 200,
      body: {
        success: true,
        data: {
          ...extraction,
          source_type: 'wechat',
          source_url: sourceUrl,
          source_name: article.sourceName,
          source_published_on: article.publishedOn,
        },
      },
    }
  } catch (error) {
    if (error instanceof JobPostingApiError) return { status: error.status, body: { success: false, error: { code: error.code, message: error.message } } }
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return { status: 504, body: { success: false, error: { code: 'AI_TIMEOUT', message: '提取超时，请稍后重试。' } } }
    console.error('Job posting API failed:', error)
    return { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: '招聘整理服务暂时出错。' } } }
  }
}
