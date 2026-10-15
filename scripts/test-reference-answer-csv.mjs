import assert from 'node:assert/strict'
import { getReviewFlags, isApproved, parseCsv, toCsv } from './lib/referenceAnswerCsv.mjs'

// Reviewed answers pass through Excel/WPS and back; commas, quotes, line breaks, and Chinese text
// must survive the round trip, including the CRLF line endings and BOM those tools write.
const rows = [
  {
    position_key: 'restaurant', question_id: 'restaurant_1', question: 'Why do you want to work on a ship?',
    tip: '动机, 稳定性', question_type: 'motivation', level: 'entry',
    answer_en: 'I said "yes" right away,\nbecause I love serving guests.', key_points_zh: '· 第一点\n· 第二点', review_flags: '', approved: '是',
  },
  { position_key: 'restaurant', question_id: 'restaurant_2', question: 'Plain', tip: '', question_type: '', level: '', answer_en: 'Short.', key_points_zh: '', review_flags: '回答偏短', approved: '' },
]
const csv = toCsv(rows)
assert.ok(csv.startsWith('﻿'), 'Starts with a BOM for Excel.')
assert.deepEqual(parseCsv(csv), rows)
assert.deepEqual(parseCsv(csv.replace(/\r\n/g, '\n')), rows, 'LF-only files parse too.')

// A trailing blank line and surrounding spaces in cells are ignored.
assert.deepEqual(parseCsv('a,b\r\n x , y \r\n\r\n'), [{ a: 'x', b: 'y' }])

for (const value of ['Y', 'y', 'yes', '是', '通过', 'OK', ' 是 ']) assert.equal(isApproved(value), true, value)
for (const value of ['', 'N', '否', 'maybe', undefined]) assert.equal(isApproved(value), false, String(value))

const long = Array(90).fill('word').join(' ')
assert.equal(getReviewFlags({ question: 'Describe your PMS experience.', tip: '', answer_en: `${long} USPH`, key_points_zh: '· ok' }), '提到 USPH 但题目与卫生无关，请核实')
assert.equal(getReviewFlags({ question: 'How do you keep the buffet sanitary?', tip: '', answer_en: `${long} USPH`, key_points_zh: '· ok' }), '')
assert.equal(getReviewFlags({ question: 'q', tip: '', answer_en: '', key_points_zh: '' }), '缺少回答')
assert.equal(getReviewFlags({ question: 'q', tip: '', answer_en: long, key_points_zh: '一,二' }), '要点格式异常')

// Knowledge questions should be answered briefly; experience answers must not invent history.
assert.equal(getReviewFlags({ question_type: 'knowledge', question: 'What does POS mean?', tip: '', answer_en: long, key_points_zh: '· ok' }), '简单题回答过长')
assert.equal(getReviewFlags({ question_type: 'knowledge', question: 'What does POS mean?', tip: '', answer_en: 'Point of Sale, the till system.', key_points_zh: '· ok' }), '')
const framework = 'In my last job at [type of restaurant], I looked after [number] tables. One busy night [describe what happened], so I asked my supervisor and we solved it together. The guests left happy and I learned to stay calm and check every order twice before sending it to the kitchen.'
assert.equal(getReviewFlags({ question_type: 'experience', question: 'q', tip: '', answer_en: framework, key_points_zh: '· ok' }), '')
assert.equal(
  getReviewFlags({ question_type: 'experience', question: 'q', tip: '', answer_en: framework.replace('[number]', '12').replace('[type of restaurant]', 'a hotel').replace('[describe what happened]', 'guests rose 30 percent'), key_points_zh: '· ok' }),
  '经历题没有留出填写真实经历的位置；经历题含具体数字，请确认不是替考生编造',
)
assert.equal(
  getReviewFlags({ question_type: 'situational', question: 'q', tip: '', answer_en: 'I would wait about 15 minutes, then tell my supervisor and follow the ship procedure for releasing the table to other guests waiting.', key_points_zh: '· ok' }),
  '回答偏短；情境题含具体时长或数字，请确认不是把某家公司的规定写成通用规则',
)
assert.equal(getReviewFlags({ question_type: 'demonstration', question: 'q', tip: '', answer_en: 'I would lean in and repeat the order back to the guest clearly, then confirm any allergies before sending it.', key_points_zh: '· ok' }), '演示题应写出对客人说的原话')
assert.equal(getReviewFlags({ question_type: 'demonstration', question: 'q', tip: '', answer_en: '[Lean in] "Excuse me, just to confirm, that is two salmon and one steak, medium. Does anyone have an allergy?"', key_points_zh: '· ok' }), '')

console.log('reference answer csv: ok')
