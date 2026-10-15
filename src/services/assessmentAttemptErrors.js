const ATTEMPT_ERROR_MESSAGES = {
  LOGIN_REQUIRED: '请先登录后再开始实战评估。',
  VERIFIED_ACCOUNT_REQUIRED: '请先使用正式邮箱账号登录后再开始实战评估。',
  ASSESSMENT_LIMIT_REACHED: '你的 3 次完整评估机会已全部使用。',
  ASSESSMENT_ATTEMPT_EXPIRED: '本次实战评估已超过 2 小时，请重新开始。',
  ASSESSMENT_ATTEMPT_NOT_ACTIVE: '本次实战评估已经结束，请返回后重新开始。',
}

const NETWORK_ERROR_MESSAGE = '网络连接失败，请检查网络后重试。'

export const isAuthTokenError = (error) =>
  /^PGRST30\d$/.test(error?.code || '') || /JWT/i.test(error?.message || '')

const isNetworkError = (error) =>
  /Failed to fetch|Load failed|NetworkError/i.test(error?.message || '')

export const toAttemptError = (error, fallbackMessage) => {
  console.error('Assessment attempt request failed:', error)
  const matchedCode = isAuthTokenError(error)
    ? 'LOGIN_REQUIRED'
    : Object.keys(ATTEMPT_ERROR_MESSAGES).find((code) => error?.message?.includes(code))
  let message = matchedCode ? ATTEMPT_ERROR_MESSAGES[matchedCode] : fallbackMessage
  if (!matchedCode) {
    if (isNetworkError(error)) message = NETWORK_ERROR_MESSAGE
    else if (error?.code) message = `${fallbackMessage}（错误代码：${error.code}）`
  }
  const nextError = new Error(message)
  nextError.code = matchedCode || error?.code || 'ASSESSMENT_ACCESS_FAILED'
  return nextError
}

// A phone tab resumed from the background can still hold an expired access
// token; refresh the session once and retry before reporting a failure.
export const callAttemptRpc = async (client, name, args) => {
  const result = await client.rpc(name, args)
  if (!result.error || !isAuthTokenError(result.error)) return result
  const { error: refreshError } = await client.auth.refreshSession()
  if (refreshError) return result
  return client.rpc(name, args)
}
