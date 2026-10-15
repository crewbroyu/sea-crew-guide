import process from 'node:process'
import { sendTtsResponse } from '../server/tts.js'

export const config = {
  maxDuration: 30,
}

export default async function handler(request, response) {
  await sendTtsResponse({
    method: request.method,
    headers: request.headers,
    body: request.body,
    env: process.env,
    response,
  })
}
