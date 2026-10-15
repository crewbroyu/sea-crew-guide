import { hasProductEntitlement } from '../utils/accessPolicy.js'

// ¥99 interview practice pack: question bank reference answers, voice practice, and AI feedback
// for these positions. Mirrors the product row in 20261017090000_interview_practice_pack.sql.
export const INTERVIEW_PRACTICE_PRODUCT_CODE = 'interview_practice_pack'
export const INTERVIEW_PRACTICE_PACK = {
  name: '面试练习包',
  priceCny: 99,
  accessDays: 90,
  aiFeedbackQuota: 60,
}
export const PRACTICE_PACK_POSITIONS = ['restaurant', 'housekeeping', 'front_office', 'bar_server', 'retail']

const POSITION_PACKS = { bar_server: 'bar_server_pack', retail: 'retail_sales_pack' }

export const isPracticePackPosition = (positionKey) => PRACTICE_PACK_POSITIONS.includes(positionKey)

// Products whose holders may use voice practice, AI feedback, and reference answers for a position.
export const getPracticeProductCodes = (positionKey) => [
  ...(POSITION_PACKS[positionKey] ? [POSITION_PACKS[positionKey]] : []),
  ...(isPracticePackPosition(positionKey) ? [INTERVIEW_PRACTICE_PRODUCT_CODE] : []),
]

export const hasPracticeAccess = (access, positionKey) => getPracticeProductCodes(positionKey)
  .some((productCode) => hasProductEntitlement(access, productCode))

// Bar Server keeps its own pack page and free trial funnel; other covered positions go to the
// practice pack page.
export const getPracticeUpgradeRoute = (positionKey, source) => {
  const params = new URLSearchParams({ source })
  if (positionKey) params.set('position', positionKey)
  return positionKey === 'bar_server' ? `/premium?${params}` : `/premium/interview?${params}`
}
