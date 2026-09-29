const endpoint = process.env.DASHSCOPE_TTS_URL
  || process.env.DASHSCOPE_ASR_URL
  || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const apiKey = process.env.DASHSCOPE_API_KEY
const model = process.env.DASHSCOPE_TTS_MODEL || 'qwen3-tts-flash'
const defaultVoice = process.env.DASHSCOPE_TTS_VOICE || 'Cherry'

if (!apiKey) {
  console.error('DASHSCOPE_API_KEY is not configured.')
  process.exit(1)
}

const samples = [
  { voice: 'Ethan', languageType: 'English', text: 'Excuse me. I ordered thirty minutes ago.' },
  { voice: 'Serena', languageType: 'English', text: 'I have a severe shellfish allergy. Is this soup safe?' },
  { voice: defaultVoice, languageType: 'Chinese', text: '请讲一次你亲自处理客诉的真实经历。' },
]

for (const sample of samples) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: {
        text: sample.text,
        voice: sample.voice,
        language_type: sample.languageType,
      },
    }),
  })
  const body = await response.json().catch(() => null)

  if (!response.ok || !body?.output?.audio?.url) {
    console.error('Alibaba Cloud TTS failed:', response.status, sample.voice, body?.code || '', body?.message || '')
    process.exit(1)
  }

  console.log(`Alibaba Cloud TTS: OK (${model}, ${sample.voice}, ${sample.languageType}, ${body.usage?.characters || 0} characters)`)
}

