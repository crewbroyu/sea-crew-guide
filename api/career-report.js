import process from 'node:process'
import { handleCareerReportRequest } from '../server/careerReport.js'

export const config = { maxDuration: 90 }

export default async function handler(request, response) {
  const result = await handleCareerReportRequest({
    method: request.method,
    headers: request.headers,
    body: request.body,
    env: process.env,
  })
  response.status(result.status).json(result.body)
}
