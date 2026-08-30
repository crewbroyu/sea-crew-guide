import { supabase } from '../supabase'

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.id) {
    return null
  }

  return user
}

const buildWeakPoints = (questionScores = []) =>
  questionScores
    .filter((item) => {
      const maxScore = Number(item?.maxScore || 100)
      return maxScore > 0 && Number(item?.score || 0) / maxScore < 0.6
    })
    .slice(0, 3)
    .map((item) => ({
      question: item.question || '',
      score: item.score || 0,
      comment: item.comment || '',
    }))

export const saveInterviewPracticeRecord = async ({
  targetPosition,
  interviewerName = null,
  questions = [],
  answers = [],
  evaluation = null,
  source = 'ai_mock_interview',
}) => {
  const user = await getCurrentUser()
  if (!user) return null

  const questionScores = evaluation?.questionScores || []
  const payload = {
    user_id: user.id,
    target_position: targetPosition,
    source,
    interviewer_name: interviewerName,
    questions,
    answers,
    question_scores: questionScores,
    overall_score: evaluation?.overallScore || 0,
    rating: evaluation?.rating || null,
    overall_suggestion: evaluation?.overallSuggestion || null,
    weak_points: buildWeakPoints(questionScores),
  }

  const { data, error } = await supabase
    .from('interview_practice_records')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const getLatestInterviewPracticeRecord = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('interview_practice_records')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}
