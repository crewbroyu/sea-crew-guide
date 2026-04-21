// src/store/scoreStore.js

// 重新计算总积分
const recalculateTotalScore = () => {
  const completedTasks = calculateCompletedTasks()
  const scoreData = JSON.parse(localStorage.getItem('score_data') || '{}')
  
  // 计算任务完成积分
  let taskScore = 0
  for (let i = 1; i <= completedTasks; i++) {
    taskScore += i % 3 === 0 ? 100 : 50
  }
  
  // 计算阶段完成积分（假设每个阶段3个任务）
  const completedStages = Math.floor(completedTasks / 3)
  const stageScore = completedStages * 200
  
  // 计算打卡积分
  const checkinData = JSON.parse(localStorage.getItem('checkin_data') || '{}')
  const checkinDates = Object.keys(checkinData)
  const checkinCount = checkinDates.length
  
  let checkinScore = 0
  let continuousDays = 0
  let lastDate = null
  
  // 计算连续打卡天数
  checkinDates.sort().forEach(dateStr => {
    const date = new Date(dateStr)
    if (!lastDate) {
      continuousDays = 1
    } else {
      const diffTime = date - lastDate
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        continuousDays += 1
      } else {
        continuousDays = 1
      }
    }
    lastDate = date
    
    // 基础打卡积分
    checkinScore += 10
    
    // 连续打卡奖励
    if (continuousDays % 7 === 0) {
      checkinScore += 50
    } else if (continuousDays % 30 === 0) {
      checkinScore += 200
    }
  })
  
  // 总积分
  const totalScore = taskScore + stageScore + checkinScore
  
  return {
    totalScore,
    taskCompleted: completedTasks,
    continuousDays,
    stageCompleted: completedStages
  }
}

// 初始化积分数据
const initializeScore = () => {
  const recalculatedData = recalculateTotalScore()
  const scoreData = localStorage.getItem('score_data')
  
  if (!scoreData) {
    const initialData = {
      totalScore: recalculatedData.totalScore,
      usedScore: 0,
      continuousDays: recalculatedData.continuousDays,
      lastCheckinDate: null,
      scoreHistory: [],
      taskCompleted: recalculatedData.taskCompleted,
      stageCompleted: recalculatedData.stageCompleted
    }
    localStorage.setItem('score_data', JSON.stringify(initialData))
    return initialData
  }
  
  const existingData = JSON.parse(scoreData)
  const updatedData = {
    ...existingData,
    totalScore: recalculatedData.totalScore,
    taskCompleted: recalculatedData.taskCompleted,
    continuousDays: recalculatedData.continuousDays,
    stageCompleted: recalculatedData.stageCompleted
  }
  localStorage.setItem('score_data', JSON.stringify(updatedData))
  return updatedData
}

// 获取积分数据
export const getScoreData = () => {
  return initializeScore()
}

// 更新积分数据
export const updateScoreData = (data) => {
  localStorage.setItem('score_data', JSON.stringify(data))
}

// 增加积分
export const addScore = (amount, type, description) => {
  const scoreData = getScoreData()
  const newScore = {
    ...scoreData,
    totalScore: scoreData.totalScore + amount,
    scoreHistory: [
      {
        id: Date.now().toString(),
        type,
        amount,
        description,
        date: new Date().toISOString()
      },
      ...scoreData.scoreHistory
    ]
  }
  updateScoreData(newScore)
  return newScore
}

// 使用积分
export const useScore = (amount, description) => {
  const scoreData = getScoreData()
  if (scoreData.totalScore >= amount) {
    const newScore = {
      ...scoreData,
      totalScore: scoreData.totalScore - amount,
      usedScore: scoreData.usedScore + amount,
      scoreHistory: [
        {
          id: Date.now().toString(),
          type: 'use',
          amount: -amount,
          description,
          date: new Date().toISOString()
        },
        ...scoreData.scoreHistory
      ]
    }
    updateScoreData(newScore)
    return newScore
  }
  return scoreData
}

// 计算实际完成的任务数
const calculateCompletedTasks = () => {
  const progressKey = 'boarding_progress'
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}')
  let completedCount = 0
  
  // 检查所有12个任务的完成状态
  for (let i = 1; i <= 12; i++) {
    if (progress[`task${i}`] && progress[`task${i}`].completed) {
      completedCount++
    }
  }
  
  return completedCount
}

// 记录任务完成
export const recordTaskComplete = (taskId, taskTitle) => {
  const scoreData = getScoreData()
  const completedTasks = calculateCompletedTasks()
  const newScore = {
    ...scoreData,
    taskCompleted: completedTasks
  }
  updateScoreData(newScore)
  
  // 任务完成奖励积分
  let scoreAmount = 50
  if (taskId % 3 === 0) {
    scoreAmount = 100 // 每3个任务奖励更多积分
  }
  
  return addScore(scoreAmount, 'task_complete', `完成任务${taskId}：${taskTitle}`)
}

// 记录阶段完成
export const recordStageComplete = (stageId, stageName) => {
  const scoreData = getScoreData()
  const newScore = {
    ...scoreData,
    stageCompleted: scoreData.stageCompleted + 1
  }
  updateScoreData(newScore)
  
  // 阶段完成奖励积分
  return addScore(200, 'stage_complete', `完成阶段${stageId}：${stageName}`)
}

// 记录连续打卡
export const recordCheckin = () => {
  const scoreData = getScoreData()
  const today = new Date().toDateString()
  const lastDate = scoreData.lastCheckinDate ? new Date(scoreData.lastCheckinDate).toDateString() : null
  
  let newContinuousDays = scoreData.continuousDays
  if (lastDate !== today) {
    // 检查是否是连续的
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toDateString()
    
    if (lastDate === yesterdayString) {
      newContinuousDays += 1
    } else {
      newContinuousDays = 1
    }
    
    const newScore = {
      ...scoreData,
      continuousDays: newContinuousDays,
      lastCheckinDate: new Date().toISOString()
    }
    updateScoreData(newScore)
    
    // 打卡奖励积分
    let scoreAmount = 10
    if (newContinuousDays % 7 === 0) {
      scoreAmount = 50 // 连续7天额外奖励
    } else if (newContinuousDays % 30 === 0) {
      scoreAmount = 200 // 连续30天额外奖励
    }
    
    return addScore(scoreAmount, 'checkin', `连续打卡${newContinuousDays}天`)
  }
  
  return scoreData
}

export default {
  getScoreData,
  updateScoreData,
  addScore,
  useScore,
  recordTaskComplete,
  recordStageComplete,
  recordCheckin
}