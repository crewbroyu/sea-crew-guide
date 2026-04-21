const tcb = require('@cloudbase/node-sdk')

exports.main = async (event, context) => {
  const cloudbase = tcb.init({
    env: 'cloud1-3glovk2z550b79f4'
  })
  const db = cloudbase.database()
  
  const { userId, courseId } = event
  
  try {
    let query = db.collection('checkin_records')
    
    if (userId) {
      query = query.where({ userId })
    }
    
    if (courseId) {
      query = query.where({ courseId })
    }
    
    const records = await query.orderBy('checkinTime', 'desc').get()
    
    return {
      code: 0,
      message: '获取成功',
      data: records.data
    }
  } catch (error) {
    console.error('获取失败:', error)
    return {
      code: -1,
      message: '获取失败',
      error: error.message
    }
  }
}