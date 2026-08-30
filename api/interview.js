import { handleInterviewRequest } from '../server/interviewAi.js'
import process from 'node:process'

export const config = {
  maxDuration: 90,
}

export default async function handler(request, response) {
  const result = await handleInterviewRequest({
    method: request.method,
    headers: request.headers,
    body: request.body,
    env: process.env,
  })

  response.status(result.status).json(result.body)
}
