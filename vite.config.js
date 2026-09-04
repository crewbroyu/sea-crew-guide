import { defineConfig, loadEnv } from 'vite'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleInterviewRequest } from './server/interviewAi.js'
import { handleCareerReportRequest } from './server/careerReport.js'

const readJsonBody = async (request) => {
  const chunks = []
  let size = 0

  for await (const chunk of request) {
    size += chunk.length
    if (size > 4_000_000) {
      const error = new Error('Request body too large')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : {}
}

const localInterviewApi = (env) => ({
  name: 'local-interview-api',
  configureServer(server) {
    server.middlewares.use('/api/interview', async (request, response) => {
      try {
        const body = await readJsonBody(request)
        const result = await handleInterviewRequest({
          method: request.method,
          headers: request.headers,
          body,
          env,
        })

        response.statusCode = result.status
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify(result.body))
      } catch (error) {
        response.statusCode = error.status || 400
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify({
          success: false,
          error: {
            code: error.status === 413 ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
            message: error.status === 413 ? '录音文件过大。' : '请求格式无效。',
          },
        }))
      }
    })
  },
})

const localCareerReportApi = (env) => ({
  name: 'local-career-report-api',
  configureServer(server) {
    server.middlewares.use('/api/career-report', async (request, response) => {
      try {
        const body = await readJsonBody(request)
        const result = await handleCareerReportRequest({
          method: request.method,
          headers: request.headers,
          body,
          env,
        })

        response.statusCode = result.status
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify(result.body))
      } catch (error) {
        response.statusCode = error.status || 400
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify({
          success: false,
          error: {
            code: error.status === 413 ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
            message: error.status === 413 ? '请求内容过大。' : '请求格式无效。',
          },
        }))
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      localInterviewApi(env),
      localCareerReportApi(env),
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'https://cloud1-3glovk2z550b79f4.service.tcloudbase.com',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
