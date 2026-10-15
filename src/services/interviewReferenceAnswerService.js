import { supabase } from '../supabase'

// Reviewed reference answers live in interview_reference_answers; RLS returns rows only to holders
// of the interview practice pack, the matching position pack, or admins.
const cache = new Map()

export const getReferenceAnswers = async (positionKey) => {
  if (cache.has(positionKey)) return cache.get(positionKey)
  const { data, error } = await supabase
    .from('interview_reference_answers')
    .select('question_id, answer_en, key_points_zh')
    .eq('position_key', positionKey)
  if (error) throw error
  const answers = Object.fromEntries((data || []).map((row) => [row.question_id, row]))
  // Do not cache an empty result: it may mean access was granted after the first read.
  if (data?.length) cache.set(positionKey, answers)
  return answers
}
