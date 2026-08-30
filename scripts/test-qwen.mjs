import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

const apiKey = process.env.DASHSCOPE_API_KEY?.trim()
const baseUrl = (process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1')
  .replace(/\/+$/, '')
const asrUrl = process.env.DASHSCOPE_ASR_URL
  || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

if (!apiKey || apiKey.includes('YOUR_') || apiKey.includes('API_KEY')) {
  console.error('DASHSCOPE_API_KEY is missing or still contains a placeholder.')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
}

const readJsonResponse = async (response) => {
  const raw = await response.text()
  let body

  try {
    body = JSON.parse(raw)
  } catch {
    body = { message: raw.slice(0, 300) }
  }

  if (!response.ok) {
    const code = body.code || body.error?.code || `HTTP_${response.status}`
    const message = body.message || body.error?.message || 'Unknown API error'
    throw new Error(`${code}: ${message}`)
  }

  return body
}

const testTextModel = async () => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'qwen3.5-plus',
      messages: [
        {
          role: 'system',
          content: 'You are an API smoke test. Follow the requested output exactly.',
        },
        {
          role: 'user',
          content: 'Reply with exactly: QWEN_TEXT_OK',
        },
      ],
      enable_thinking: false,
      temperature: 0,
    }),
  })
  const body = await readJsonResponse(response)
  const content = body.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('Text model returned no message content.')
  }

  console.log(`Text model: OK (${content.slice(0, 80)})`)
}

const mimeTypes = {
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
}

const testAsrModel = async (audioSource) => {
  const isRemote = /^https?:\/\//i.test(audioSource)
  const sourcePath = isRemote ? new URL(audioSource).pathname : audioSource
  const extension = extname(sourcePath).toLowerCase()
  const mimeType = mimeTypes[extension]

  if (!mimeType) {
    throw new Error(`Unsupported smoke-test audio format: ${extension || '(none)'}`)
  }

  const audioData = isRemote
    ? audioSource
    : `data:${mimeType};base64,${(await readFile(audioSource)).toString('base64')}`
  const response = await fetch(asrUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'X-DashScope-SSE': 'disable',
    },
    body: JSON.stringify({
      model: 'qwen-audio-3.0-asr-flash',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: { data: audioData },
              },
            ],
          },
        ],
      },
      parameters: {
        format: extension.slice(1),
        sample_rate: extension === '.wav' ? '16000' : undefined,
      },
    }),
  })
  const body = await readJsonResponse(response)
  const transcript = body.output?.text || body.output?.output?.sentence?.text

  if (!transcript) {
    throw new Error('ASR model returned no transcript text.')
  }

  console.log(`ASR model: OK (${transcript.slice(0, 160)})`)
}

const main = async () => {
  console.log('Testing Qwen models without printing credentials...')
  await testTextModel()

  const audioPath = process.argv[2]
  if (audioPath) {
    await testAsrModel(audioPath)
  } else {
    console.log('ASR model: SKIPPED (pass a WAV, MP3, M4A, or WebM file path)')
  }
}

main().catch((error) => {
  console.error(`Qwen smoke test failed: ${error.message}`)
  process.exit(1)
})
