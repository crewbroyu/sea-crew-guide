// src/data/assessmentScoring.js
import { DIMENSIONS } from './assessmentData'

export function calculateDimensionScore(answers, questions) {
  let totalScore = 0
  let totalMaxScore = 0

  questions.forEach((question) => {
    const answer = answers[question.id]

    if (question.type === 'multiple') {
      if (Array.isArray(answer)) {
        totalScore += answer.reduce((sum, optionId) => {
          const option = question.options.find((item) => item.id === optionId)
          return sum + (option?.score || 0)
        }, 0)
      }
    } else {
      const selectedOption = question.options?.find((item) => item.id === answer)
      totalScore += selectedOption?.score || 0
    }

    totalMaxScore += question.maxScore || 0
  })

  if (!totalMaxScore) return 0
  return Math.round((totalScore / totalMaxScore) * 100)
}

export function getLevel(score) {
  if (score >= 82) return { level: 'ready', label: '准备度较高', color: 'green' }
  if (score >= 68) return { level: 'almost', label: '具备基础条件', color: 'blue' }
  if (score >= 50) return { level: 'improve', label: '需要重点补强', color: 'yellow' }
  return { level: 'gap', label: '暂不建议急着投递', color: 'red' }
}

export function getCareerConclusion(score, dimensionScores = {}) {
  const eligibility = dimensionScores.eligibility || 0
  const english = dimensionScores.english || 0
  const adaptability = dimensionScores.ship_adaptability || 0

  if (eligibility < 45 || adaptability < 45) {
    return {
      type: 'caution',
      title: '暂不建议立刻投递',
      summary: '你的现实条件或船上适应力还需要进一步确认。建议先补充行业认知、英语和真实服务经验，再进入申请阶段。',
    }
  }

  if (score >= 78 && english >= 65) {
    return {
      type: 'strong',
      title: '适合进入海乘申请准备',
      summary: '你已经具备比较清晰的职业准备基础，可以开始围绕目标岗位准备英文简历、面试案例和申请渠道。',
    }
  }

  if (score >= 60) {
    return {
      type: 'developing',
      title: '适合尝试，但需要有计划准备',
      summary: '你具备一定基础，但还不能盲目投递。建议先确定岗位方向，再用 30-90 天补齐英语、简历或面试短板。',
    }
  }

  return {
    type: 'early',
    title: '仍处于早期了解阶段',
    summary: '你目前更适合先完成行业认知、岗位了解和基础英语准备，再决定是否投入申请成本。',
  }
}

export function calculateOverallScore(dimensionScores) {
  return Math.round(
    DIMENSIONS.reduce((total, dimension) => {
      return total + (dimensionScores[dimension.id] || 0) * dimension.weight
    }, 0)
  )
}
