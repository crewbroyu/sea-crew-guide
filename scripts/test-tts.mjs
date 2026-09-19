const endpoint = process.env.DASHSCOPE_TTS_URL
  || process.env.DASHSCOPE_ASR_URL
  || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const apiKey = process.env.DASHSCOPE_API_KEY
const model = process.env.DASHSCOPE_TTS_MODEL || 'qwen3-tts-flash'
const voice = process.env.DASHSCOPE_TTS_VOICE || 'Cherry'

if (!apiKey) {
  console.error('DASHSCOPE_API_KEY is not configured.')
  process.exit(1)
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,
    input: {
      text: 'Welcome aboard. How may I help you today?',
      voice,
      language_type: 'English',
    },
  }),
})
const body = await response.json().catch(() => null)

if (!response.ok || !body?.output?.audio?.url) {
  console.error('Alibaba Cloud TTS failed:', response.status, body?.code || '', body?.message || '')
  process.exit(1)
}

console.log(`Alibaba Cloud TTS: OK (${model}, ${voice}, ${body.usage?.characters || 0} characters)`)

