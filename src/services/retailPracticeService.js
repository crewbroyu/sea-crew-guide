import { nextPreparationTimestamp } from '../data/foundationSync'
import { supabase } from '../supabase'
import { mergeRetailPractice } from '../data/retailPracticeProgress'
const currentUser = async (expectedUserId) => {
 const {data:{user},error} = await supabase.auth.getUser()
 if (error) throw error
 if (!user || user.id !== expectedUserId) throw new Error('Account changed; practice was not synced')
 return user
}
export const getMyRetailPractice = async (userId) => {
 await currentUser(userId)
 const {data,error} = await supabase.from('job_preparation_profiles').select('learning_records').eq('user_id',userId).maybeSingle()
 if(error) throw error
 return data?.learning_records?.retailPractice || null
}
export const saveMyRetailPractice = async (userId, practice) => {
 const user = await currentUser(userId)
 for(let attempt=0;attempt<3;attempt++) {
  const {data:existing,error:readError} = await supabase.from('job_preparation_profiles').select('learning_records,updated_at').eq('user_id',user.id).maybeSingle()
  if(readError) throw readError
  const merged = mergeRetailPractice(existing?.learning_records?.retailPractice,practice)
  const payload = {learning_records:{...(existing?.learning_records || {}),retailPractice:merged},updated_at:nextPreparationTimestamp(existing?.updated_at)}
  await currentUser(user.id)
  if(!existing) {
   const {error} = await supabase.from('job_preparation_profiles').insert({...payload,user_id:user.id,email:user.email,selected_role:'retail',role_title:'Retail Sales Associate'})
   if(!error) return merged
   if(error.code === '23505') continue
   throw error
  }
  let query = supabase.from('job_preparation_profiles').update(payload).eq('user_id',user.id)
  query = existing.updated_at ? query.eq('updated_at',existing.updated_at) : query.is('updated_at',null)
  const {data,error} = await query.select('user_id').maybeSingle()
  if(error) throw error
  if(data) return merged
 }
 throw new Error('Progress changed on another page; retry sync')
}
