import { supabase } from '../supabase'

export const createManualPurchaseRequest = async (productCode) => {
  const { data, error } = await supabase.rpc('create_manual_purchase_request', {
    input_product_code: productCode,
  })

  if (error) throw error
  return data
}

export const getMyManualPurchaseRequest = async (productCode) => {
  if (!productCode) return null

  const { data, error } = await supabase
    .from('manual_purchase_requests')
    .select('id, product_code, price_cny, reference_code, status, created_at, payment_confirmed_at, activation_sent_at')
    .eq('product_code', productCode)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getManualPurchaseRequests = async () => {
  const { data, error } = await supabase
    .from('manual_purchase_requests')
    .select('id, user_id, contact_email, product_code, price_cny, reference_code, status, created_at, payment_confirmed_at, activation_sent_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const updateManualPurchaseRequest = async (id, status) => {
  const timestamp = new Date().toISOString()
  const patch = { status, updated_at: timestamp }

  if (status === 'payment_confirmed') patch.payment_confirmed_at = timestamp
  if (status === 'activation_sent') patch.activation_sent_at = timestamp

  const { data, error } = await supabase
    .from('manual_purchase_requests')
    .update(patch)
    .eq('id', id)
    .select('id, status, payment_confirmed_at, activation_sent_at')
    .single()

  if (error) throw error
  return data
}
