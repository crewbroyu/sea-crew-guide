import { supabase } from '../supabase'

async function callPartnerRpc(rpc, action, data) {
  const { data: result, error } = await supabase.rpc(rpc, {
    input_action: action,
    input_data: data,
  }).abortSignal(AbortSignal.timeout(15000))
  if (error) {
    if (['PGRST202', '42883', '3F000'].includes(error.code)) {
      throw new Error('合作工作台尚未启用，请联系平台管理员完成数据库更新。')
    }
    if (error.code === '40001') throw new Error('任务已被更新，请刷新并核对最新状态后重试。')
    if (error.code === '23P01') throw new Error('该导师在这个时段已有预约，请选择其他时间。')
    if (error.code === '22023') throw new Error('当前状态或填写内容不适用，请核对任务状态、时间和服务记录。')
    if (error.code === '42501') throw new Error('当前账号无权执行此操作，或授权已失效。')
    throw new Error('操作未完成，请检查账号编号、认证状态及有效期后重试。')
  }
  if (!result || (action === 'read' && result.version !== 1)) throw new Error('工作台数据暂不可用，请稍后重试。')
  return result
}

export function partnerWorkspace(action = 'read', data = {}) {
  return callPartnerRpc('partner_workspace_v1', action, data)
}
export function partnerDirectory(action, data = {}) {
  return callPartnerRpc('partner_directory_v1', action, data)
}

export function partnerServiceTasks(action = 'read', data = {}) {
  return callPartnerRpc('partner_service_tasks_v1', action, data)
}
