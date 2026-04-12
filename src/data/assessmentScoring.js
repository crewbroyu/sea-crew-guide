// src/data/assessmentScoring.js

// 各维度评分
export function calculateDimensionScore(answers, questions) {
  let totalScore = 0;
  let totalMaxScore = 0;
  questions.forEach(q => {
    const answer = answers[q.id];
    if (q.type === 'multi' && q.scoringRule === 'vocab') {
      // 词汇题特殊评分
      const count = answer ? answer.length : 0;
      totalScore += count >= 6 ? 3 : count >= 3 ? 2 : 1;
    } else if (answer) {
      const selectedOption = q.options.find(o => o.id === answer);
      totalScore += selectedOption ? selectedOption.score : 0;
    }
    totalMaxScore += q.maxScore;
  });
  return Math.round((totalScore / totalMaxScore) * 100);
}

// 等级判定
export function getLevel(score) {
  if (score >= 80) return { level: 'ready', label: '准备充分', color: 'green' };
  if (score >= 60) return { level: 'almost', label: '基本合格', color: 'blue' };
  if (score >= 40) return { level: 'improve', label: '需要提升', color: 'yellow' };
  return { level: 'gap', label: '明显短板', color: 'red' };
}

// 综合就绪度（加权平均）
export function calculateOverallScore(dimensionScores) {
  const weights = { professional: 0.20, english: 0.25, interview: 0.20, personality: 0.15, adaptability: 0.20 };
  let total = 0;
  Object.entries(weights).forEach(([key, weight]) => {
    total += (dimensionScores[key] || 0) * weight;
  });
  return Math.round(total);
}
