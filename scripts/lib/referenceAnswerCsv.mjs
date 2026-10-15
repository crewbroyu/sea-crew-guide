// CSV helpers for reference answer review files. Files start with a UTF-8 BOM so Excel and WPS
// open the Chinese text correctly.
export const REVIEW_COLUMNS = ['position_key', 'question_id', 'question', 'tip', 'question_type', 'level', 'answer_en', 'key_points_zh', 'review_flags', 'approved']

// Automatic hints for the reviewer; they never block import.
export const getReviewFlags = (row) => {
  const flags = []
  const answer = String(row.answer_en || '')
  const words = answer.split(/\s+/).filter(Boolean).length
  if (!words) flags.push('缺少回答')
  else if (row.question_type === 'knowledge' && words > 60) flags.push('简单题回答过长')
  else if (!['knowledge', 'demonstration'].includes(row.question_type) && words < 40) flags.push('回答偏短')
  if (row.question_type === 'experience') {
    const outsideBrackets = answer.replace(/\[[^\]]*\]/g, '')
    if (!answer.includes('[')) flags.push('经历题没有留出填写真实经历的位置')
    if (/\d|percent|%/i.test(outsideBrackets)) flags.push('经历题含具体数字，请确认不是替考生编造')
  }
  if (row.question_type === 'situational') {
    if (/\d|\b(minutes?|hours?)\b/i.test(answer)) flags.push('情境题含具体时长或数字，请确认不是把某家公司的规定写成通用规则')
    if (words > 110) flags.push('情境题回答过长')
  }
  if (row.question_type === 'demonstration' && !/["“]/.test(answer)) flags.push('演示题应写出对客人说的原话')
  if (/USPH/.test(row.answer_en || '') && !/sanit|hygien|clean|food|illness|sick|norovirus|outbreak|wash|USPH|卫生|清洁|食品/i.test(`${row.question} ${row.tip}`)) {
    flags.push('提到 USPH 但题目与卫生无关，请核实')
  }
  if (row.key_points_zh && !String(row.key_points_zh).startsWith('· ')) flags.push('要点格式异常')
  return flags.join('；')
}

const quote = (value) => {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCsv = (rows, columns = REVIEW_COLUMNS) => '\uFEFF' + [
  columns.join(','),
  ...rows.map((row) => columns.map((column) => quote(row[column])).join(',')),
].join('\r\n') + '\r\n'

// RFC 4180 parser: quoted fields may contain commas, quotes ("") and line breaks.
export const parseCsv = (text) => {
  const source = text.replace(/^\uFEFF/, '')
  const records = []
  let record = []
  let field = ''
  let inQuotes = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (inQuotes) {
      if (char === '"' && source[index + 1] === '"') { field += '"'; index += 1 }
      else if (char === '"') inQuotes = false
      else field += char
    } else if (char === '"') inQuotes = true
    else if (char === ',') { record.push(field); field = '' }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      record.push(field); records.push(record); record = []; field = ''
    } else field += char
  }
  if (field || record.length) { record.push(field); records.push(record) }
  const [header = [], ...body] = records.filter((row) => row.some((cell) => cell.trim()))
  return body.map((row) => Object.fromEntries(header.map((name, column) => [name.trim(), (row[column] ?? '').trim()])))
}

export const isApproved = (value) => /^(y|yes|是|通过|ok|✓)$/i.test(String(value || '').trim())
