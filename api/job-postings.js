import process from 'node:process'
import { handleJobPostingRequest } from '../server/jobPostings.js'

export const config = { maxDuration: 75 }

export default async function handler(request, response) {
  const result = await handleJobPostingRequest({
    method: request.method,
    headers: request.headers,
    body: request.body,
    env: process.env,
  })
  response.status(result.status).json(result.body)
}
