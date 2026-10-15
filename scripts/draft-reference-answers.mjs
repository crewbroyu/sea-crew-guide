import fs from 'node:fs'
import process from 'node:process'
import interviewQuestions from '../src/data/interviewQuestions.js'
import { getReviewFlags, parseCsv, toCsv } from './lib/referenceAnswerCsv.mjs'

// Drafts reference answers with Qwen into content/reference-answers/<position>.csv for human review.
// The folder is gitignored: the repository is public and these answers are paid content.
// Usage: npm run draft:reference-answers -- restaurant housekeeping front_office
// Rerunning keeps existing drafts and only fills missing questions or ones whose wording changed.

const POSITIONS = ['restaurant', 'housekeeping', 'front_office', 'bar_server', 'retail']
const ROLE_CONTEXT = {
  restaurant: 'Restaurant Server / Assistant Waiter in the main dining room and buffet of an international cruise ship',
  housekeeping: 'Stateroom Attendant (housekeeping) on an international cruise ship',
  front_office: 'Guest Services Associate at the front desk of an international cruise ship',
  bar_server: 'Bar Server on an international cruise ship',
  retail: 'Retail Sales Associate in the duty-free shops of an international cruise ship',
}
const OUTPUT_DIR = new URL('../content/reference-answers/', import.meta.url)
const apiKey = process.env.DASHSCOPE_API_KEY?.trim()
const baseUrl = (process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '')
const model = process.env.DASHSCOPE_REFERENCE_ANSWER_MODEL || 'qwen3.5-plus'

const requested = process.argv.slice(2)
const positions = requested.length ? requested : ['restaurant', 'housekeeping', 'front_office']
const unknown = positions.filter((position) => !POSITIONS.includes(position))
if (unknown.length) {
  console.error(`Unknown positions: ${unknown.join(', ')}. Choose from ${POSITIONS.join(', ')}.`)
  process.exit(1)
}
if (!apiKey) {
  console.error('DASHSCOPE_API_KEY is missing. Run with --env-file=.env.local.')
  process.exit(1)
}

// Shaped by an industry review of the first drafts: answers read like memorised scripts, padded
// simple questions, invented the candidate's work history, and stated one company's procedure as
// a universal rule.
const SYSTEM_PROMPT = `You write reference answers for Chinese candidates preparing for cruise ship job interviews. The answer must sound like a real candidate speaking, not a memorised script.

First decide question_type:
- "knowledge": asks what something is or names an item (e.g. "What does POS mean?"). Answer directly in 1-3 sentences, at most 50 words. Do not add cruise standards, teamwork, or passion.
- "experience": asks about the candidate's past (e.g. "Tell me about a time...", "your experience with..."). Never invent the candidate's history. Write a short first-person framework with square-bracket placeholders the candidate fills with their own facts, e.g. "In my last job at [type of restaurant], I usually looked after [number] tables...". No made-up numbers, percentages, incidents, employers, or certificates outside the brackets. 60-110 words.
- "situational": asks what you would do. Give the concrete actions in order, 50-100 words. Where practice differs between companies or service styles (which side to serve or clear from, the sequence of courses, how long to wait for a late party, who approves a refund), say you would follow the restaurant's service style or the ship's procedure and check with your supervisor. Never give a specific number of minutes, a fixed course list, or any other rule as if it applied everywhere.
- "demonstration": asks you to show, demonstrate, or role-play (e.g. "Show me how you would..."). Do not describe what you would do. Write the actual words you would say to the guest, as short spoken lines in quotation marks with brief stage directions in square brackets, 40-90 words.
- "motivation": about why this job, strengths, goals, or ship life. Sincere and specific, 40-90 words, no clichés.

Always:
- Answer at the level of an entry-level Assistant Waiter / Waiter (or the equivalent entry role). If the question needs more seniority or specialist knowledge, answer with what an entry-level candidate can honestly say and set level to "advanced"; otherwise set level to "entry".
- Never claim the candidate already worked under USPH or any cruise standard. Mention USPH (the US Public Health sanitation inspection program) only when the question itself is about sanitation, hygiene, or food safety.
- Never suggest anything unsafe or against policy; escalate to a supervisor when beyond your authority.
- key_points_zh: an array of 2-4 short points in Simplified Chinese: how to answer this question well, which placeholders to fill with real experience, and one likely follow-up question from the interviewer (start that point with "可能追问："). Do not comment on the answer being realistic or rule-compliant.

Return JSON: {"question_type": "...", "level": "entry|advanced", "answer_en": "...", "key_points_zh": ["...", "..."]}`

const draftAnswer = async (positionKey, question) => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      enable_thinking: false,
      temperature: 0.4,
      max_completion_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Role: ${ROLE_CONTEXT[positionKey]}\nInterview question: ${question.question}\nWhat interviewers look for: ${question.tip || ''}\nKeywords: ${(question.keywords || []).join(', ')}` },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  })
  const raw = await response.text()
  if (!response.ok) throw new Error(`Provider ${response.status}: ${raw.slice(0, 200)}`)
  const content = JSON.parse(JSON.parse(raw).choices?.[0]?.message?.content || '{}')
  if (!content.answer_en) throw new Error('Empty answer')
  const points = Array.isArray(content.key_points_zh) ? content.key_points_zh : String(content.key_points_zh || '').split(/\n+/)
  return {
    question_type: ['knowledge', 'experience', 'situational', 'demonstration', 'motivation'].includes(content.question_type) ? content.question_type : '',
    level: content.level === 'advanced' ? 'advanced' : 'entry',
    answer_en: String(content.answer_en).trim(),
    key_points_zh: points.map((point) => String(point).replace(/^[·•\-\s]+/, '').trim()).filter(Boolean).map((point) => `· ${point}`).join('\n'),
  }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true })
for (const positionKey of positions) {
  const file = new URL(`${positionKey}.csv`, OUTPUT_DIR)
  const existing = fs.existsSync(file) ? Object.fromEntries(parseCsv(fs.readFileSync(file, 'utf8')).map((row) => [row.question_id, row])) : {}
  const questions = interviewQuestions[positionKey]?.questions || []
  const rows = []
  let drafted = 0
  for (const question of questions) {
    const previous = existing[question.id]
    // Keep a draft only while its question and tip are unchanged; a rewritten question needs a new answer.
    if (previous?.answer_en && previous.question === question.question && previous.tip === (question.tip || '')) {
      rows.push(previous)
      continue
    }
    try {
      const answer = await draftAnswer(positionKey, question)
      rows.push({ position_key: positionKey, question_id: question.id, question: question.question, tip: question.tip, ...answer, approved: '' })
      drafted += 1
      process.stdout.write('.')
    } catch (error) {
      console.error(`\n${positionKey} ${question.id}: ${error.message}`)
      rows.push({ position_key: positionKey, question_id: question.id, question: question.question, tip: question.tip, answer_en: '', key_points_zh: '', approved: '' })
    }
    // Save after every question so an interrupted run loses nothing.
    fs.writeFileSync(file, toCsv([...rows, ...questions.slice(rows.length).map((item) => existing[item.id]).filter(Boolean)]))
  }
  fs.writeFileSync(file, toCsv(rows.map((row) => ({ ...row, review_flags: getReviewFlags(row) }))))
  console.log(`\n${positionKey}: ${drafted} drafted, ${rows.filter((row) => row.answer_en).length}/${questions.length} with answers -> content/reference-answers/${positionKey}.csv`)
}
