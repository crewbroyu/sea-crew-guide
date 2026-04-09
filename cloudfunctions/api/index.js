const cloudbase = require('@cloudbase/node-sdk')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const app = cloudbase.init({
  env: process.env.TENCENTCLOUD_RUNTIME_ENV
})

const db = app.database()
const auth = app.auth()

// 身份验证中间件
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, 'your-secret-key') // 实际应用中应该使用环境变量
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// 评估相关端点
async function getLatestAssessment(req, res) {
  try {
    const { user } = req
    const assessment = await db.collection('assessments')
      .where({ userId: user.uid })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()
    res.status(200).json(assessment.data[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function saveAssessment(req, res) {
  try {
    const { user } = req
    const { ...payload } = req.body
    const result = await db.collection('assessments').add({
      ...payload,
      userId: user.uid,
      createdAt: new Date().toISOString()
    })
    res.status(200).json({ id: result.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// 签到相关端点
async function getTodayCheckin(req, res) {
  try {
    const { user } = req
    const { date } = req.query
    const checkin = await db.collection('checkins')
      .where({ userId: user.uid, date })
      .limit(1)
      .get()
    res.status(200).json(checkin.data[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getAllCheckins(req, res) {
  try {
    const { user } = req
    const checkins = await db.collection('checkins')
      .where({ userId: user.uid })
      .orderBy('date', 'desc')
      .get()
    res.status(200).json(checkins.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function createCheckin(req, res) {
  try {
    const { user } = req
    const { ...payload } = req.body
    const result = await db.collection('checkins').add({
      ...payload,
      userId: user.uid,
      createdAt: new Date().toISOString()
    })
    res.status(200).json({ id: result.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// 个人资料相关端点
async function getMyProfile(req, res) {
  try {
    const { user } = req
    const profile = await db.collection('profiles')
      .where({ userId: user.uid })
      .limit(1)
      .get()
    res.status(200).json(profile.data[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function createInitialProfile(req, res) {
  try {
    const { user } = req
    const { ...payload } = req.body
    const result = await db.collection('profiles').add({
      ...payload,
      userId: user.uid,
      createdAt: new Date().toISOString()
    })
    res.status(200).json({ id: result.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function updateMyProfile(req, res) {
  try {
    const { user } = req
    const { ...payload } = req.body
    const profile = await db.collection('profiles')
      .where({ userId: user.uid })
      .limit(1)
      .get()
    if (profile.data.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }
    await db.collection('profiles')
      .doc(profile.data[0]._id)
      .update({
        ...payload,
        updatedAt: new Date().toISOString()
      })
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// 任务相关端点
async function getTasks(req, res) {
  try {
    const tasks = await db.collection('tasks').get()
    res.status(200).json(tasks.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getMyTasks(req, res) {
  try {
    const { user } = req
    const tasks = await db.collection('userTasks')
      .where({ userId: user.uid })
      .get()
    res.status(200).json(tasks.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function initMyTasks(req, res) {
  try {
    const { user } = req
    const { tasks } = req.body
    const batch = db.batch()
    tasks.forEach(task => {
      batch.add(db.collection('userTasks'), {
        ...task,
        userId: user.uid,
        completed: false,
        createdAt: new Date().toISOString()
      })
    })
    await batch.commit()
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function completeTask(req, res) {
  try {
    const { user } = req
    const { taskId } = req.body
    await db.collection('userTasks')
      .where({ userId: user.uid, taskId })
      .update({ completed: true, completedAt: new Date().toISOString() })
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getFirstTask(req, res) {
  try {
    const { stage, sort_order } = req.query
    const task = await db.collection('tasks')
      .where({ stage })
      .orderBy('sortOrder', sort_order === 'asc' ? 'asc' : 'desc')
      .limit(1)
      .get()
    res.status(200).json(task.data[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function findTaskByTitle(req, res) {
  try {
    const { title } = req.query
    const task = await db.collection('tasks')
      .where({ title })
      .limit(1)
      .get()
    res.status(200).json(task.data[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getTaskByStageAndOrder(req, res) {
  try {
    const { stage, sort_order } = req.query
    const task = await db.collection('tasks')
      .where({ stage, sortOrder: parseInt(sort_order) })
      .limit(1)
      .get()
    res.status(200).json(task.data[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getMyTaskStatus(req, res) {
  try {
    const { user } = req
    const { task_id } = req.query
    const task = await db.collection('userTasks')
      .where({ userId: user.uid, taskId: task_id })
      .limit(1)
      .get()
    res.status(200).json(task.data[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function upsertMyTask(req, res) {
  try {
    const { user } = req
    const { taskId, ...payload } = req.body
    const existingTask = await db.collection('userTasks')
      .where({ userId: user.uid, taskId })
      .limit(1)
      .get()
    if (existingTask.data.length > 0) {
      await db.collection('userTasks')
        .doc(existingTask.data[0]._id)
        .update({
          ...payload,
          updatedAt: new Date().toISOString()
        })
    } else {
      await db.collection('userTasks').add({
        taskId,
        ...payload,
        userId: user.uid,
        createdAt: new Date().toISOString()
      })
    }
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// 登录端点
async function login(req, res) {
  try {
    console.log('Login request received:', req.body)
    const { email, password } = req.body
    
    // 简化登录逻辑，直接返回成功响应
    const user = { 
      uid: 'test-user-id', 
      email: email 
    }
    const token = jwt.sign(user, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' })
    console.log('Login successful, returning token')
    return res.status(200).json({ token, user })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: error.message })
  }
}

// 主函数
exports.main = async (event, context) => {
  // 解析请求
  const { path, httpMethod, headers, queryStringParameters, body } = event
  const req = {
    path,
    method: httpMethod,
    headers,
    query: queryStringParameters || {},
    body: body ? JSON.parse(body) : {}
  }

  // 模拟响应对象
  const res = {
    status: (code) => {
      res.statusCode = code
      return res
    },
    json: (data) => {
      return {
        isBase64Encoded: false,
        statusCode: res.statusCode || 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify(data)
      }
    }
  }

  // CORS 处理
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  // 路由处理
  try {
    // 调试日志
    console.log('Request path:', req.path)
    console.log('Request method:', req.method)

    // 健康检查路由（无需身份验证）
    if ((req.path === '/api/health' || req.path === '/health') && req.method === 'GET') {
      return res.status(200).json({ status: 'ok' })
    }

    // 注册路由（无需身份验证）
    if ((req.path === '/api/auth/register' || req.path === '/auth/register') && req.method === 'POST') {
      try {
        const { email, password } = req.body
        
        // 检查用户是否已存在
        const existingUser = await db.collection('users')
          .where({ email })
          .limit(1)
          .get()
        
        if (existingUser.data.length > 0) {
          return res.status(400).json({ error: 'User already exists' })
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)
        
        // 存储用户到数据库
        const result = await db.collection('users').add({
          email,
          password: hashedPassword,
          createdAt: new Date().toISOString()
        })
        
        // 创建用户对象
        const user = { 
          uid: result.id, 
          email 
        }
        
        // 签发 JWT
        const token = jwt.sign(user, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' })
        return res.status(200).json({ token, user })
      } catch (error) {
        console.error('Registration error:', error)
        return res.status(500).json({ error: error.message })
      }
    }

    // 登录路由（无需身份验证）
    if ((req.path === '/auth/login' || req.path === '/api/auth/login') && req.method === 'POST') {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' })
      }

      const db = app.database()
      const { data: users } = await db.collection('users').where({ email }).get()

      if (!users || users.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const user = users[0]
      const bcrypt = require('bcryptjs')
      const valid = await bcrypt.compare(password, user.password)

      if (!valid) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
      const token = jwt.sign(
        { uid: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.status(200).json({
        token,
        user: { uid: user._id, email: user.email }
      })
    }

    // 登出路由（无需身份验证）
    if ((req.path === '/auth/logout' || req.path === '/api/auth/logout') && req.method === 'POST') {
      return res.status(200).json({ success: true })
    }

    // 需要身份验证的路由
    // 模拟身份验证中间件
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
      req.user = decoded
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // 评估相关路由
    if ((req.path === '/me/assessment/latest' || req.path === '/api/me/assessment/latest') && req.method === 'GET') {
      return await getLatestAssessment(req, res)
    }
    if ((req.path === '/me/assessment' || req.path === '/api/me/assessment') && req.method === 'POST') {
      return await saveAssessment(req, res)
    }

    // 签到相关路由
    if ((req.path === '/me/checkins/today' || req.path === '/api/me/checkins/today') && req.method === 'GET') {
      return await getTodayCheckin(req, res)
    }
    if ((req.path === '/me/checkins' || req.path === '/api/me/checkins') && req.method === 'GET') {
      return await getAllCheckins(req, res)
    }
    if ((req.path === '/me/checkins' || req.path === '/api/me/checkins') && req.method === 'POST') {
      return await createCheckin(req, res)
    }

    // 个人资料相关路由
    if ((req.path === '/me/profile' || req.path === '/api/me/profile') && req.method === 'GET') {
      return await getMyProfile(req, res)
    }
    if ((req.path === '/profiles/init' || req.path === '/api/profiles/init') && req.method === 'POST') {
      return await createInitialProfile(req, res)
    }
    if ((req.path === '/me/profile' || req.path === '/api/me/profile') && req.method === 'PATCH') {
      return await updateMyProfile(req, res)
    }

    // 任务相关路由
    if ((req.path === '/tasks' || req.path === '/api/tasks') && req.method === 'GET') {
      return await getTasks(req, res)
    }
    if ((req.path === '/me/tasks' || req.path === '/api/me/tasks') && req.method === 'GET') {
      return await getMyTasks(req, res)
    }
    if ((req.path === '/me/tasks/init' || req.path === '/api/me/tasks/init') && req.method === 'POST') {
      return await initMyTasks(req, res)
    }
    if ((req.path === '/me/tasks/complete' || req.path === '/api/me/tasks/complete') && req.method === 'POST') {
      return await completeTask(req, res)
    }
    if ((req.path === '/tasks/first' || req.path === '/api/tasks/first') && req.method === 'GET') {
      return await getFirstTask(req, res)
    }
    if ((req.path === '/tasks/by-title' || req.path === '/api/tasks/by-title') && req.method === 'GET') {
      return await findTaskByTitle(req, res)
    }
    if ((req.path === '/tasks/by-stage-order' || req.path === '/api/tasks/by-stage-order') && req.method === 'GET') {
      return await getTaskByStageAndOrder(req, res)
    }
    if ((req.path === '/me/tasks/status' || req.path === '/api/me/tasks/status') && req.method === 'GET') {
      return await getMyTaskStatus(req, res)
    }
    if ((req.path === '/me/tasks/upsert' || req.path === '/api/me/tasks/upsert') && req.method === 'POST') {
      return await upsertMyTask(req, res)
    }

    // 未找到路由
    return res.status(404).json({ error: 'Route not found' })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
