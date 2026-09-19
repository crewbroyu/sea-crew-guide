import process from 'node:process'
import { handleTtsRequest } from '../server/tts.js'

export const config = {
  maxDuration: 30,
}

export default async function handler(request, response) {
  const result = await handleTtsRequest({
    method: request.method,
    headers: request.headers,
    body: request.body,
    env: process.env,
  })

  response.status(result.status).json(result.body)
}

