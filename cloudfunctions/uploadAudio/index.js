const tcb = require('@cloudbase/node-sdk')

exports.main = async (event, context) => {
  const cloudbase = tcb.init({
    env: 'cloud1-3glovk2z550b79f4'
  })
  const db = cloudbase.database()
  const storage = cloudbase.storage()
  
  const { audioData, userId, userName, courseId, fileExtension = 'webm' } = event
  
  try {
    // 1. 生成文件名
    const fileName = `audio/${userId}_${Date.now()}.${fileExtension}`
    
    // 2. 解码base64音频数据
    const buffer = Buffer.from(audioData, 'base64')
    
    // 3. 上传到存储
    const uploadResult = await storage.uploadFile({
      cloudPath: fileName,
      fileContent: buffer
    })
    
    // 4. 保存打卡记录到数据库
    const checkinRecord = await db.collection('checkin_records').add({
      userId,
      userName,
      courseId,
      audioUrl: uploadResult.fileID,
      checkinTime: new Date(),
      status: 'completed'
    })
    
    return {
      code: 0,
      message: '打卡成功',
      data: {
        audioUrl: uploadResult.fileID,
        recordId: checkinRecord.id
      }
    }
  } catch (error) {
    console.error('上传失败:', error)
    return {
      code: -1,
      message: '上传失败',
      error: error.message
    }
  }
}