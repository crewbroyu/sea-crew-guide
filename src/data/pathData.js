const pathData = [
  {
    id: 1,
    name: '决定出发',
    icon: '🚀',
    tasks: [
      {
        id: 1,
        title: '海乘适配评估',
        subtitle: '完成五维能力测评，了解自己的优劣势',
        route: '/tasks/assessment',
        completionType: 'auto', // auto=自动判定, upload=上传审核
      },
      {
        id: 2,
        title: '选择目标岗位',
        subtitle: '根据测评结果，选定你的目标岗位',
        route: '/tasks/choose-job',
        completionType: 'auto',
      },
      {
        id: 3,
        title: '确定申请路线',
        subtitle: '选择适合你的申请方式和路径',
        route: '/tasks/choose-route',
        completionType: 'auto',
      },
    ],
  },
  {
    id: 2,
    name: '打造能力',
    icon: '💪',
    tasks: [
      {
        id: 4,
        title: '制作英文简历',
        subtitle: '使用邮轮行业标准格式制作简历',
        route: '/tasks/resume',
        completionType: 'auto',
      },
      {
        id: 5,
        title: '学习岗位知识',
        subtitle: '完成目标岗位的英语课程学习',
        route: '/tasks/job-course',
        completionType: 'upload',
        timeLimit: 30,
      },
      {
        id: 6,
        title: '面试技巧学习',
        subtitle: '掌握邮轮面试核心技巧',
        route: '/tasks/interview-skills',
        completionType: 'auto',
      },
    ],
  },
  {
    id: 3,
    name: '拿到Offer',
    icon: '🎯',
    tasks: [
      {
        id: 7,
        title: '面试问题演练',
        subtitle: '完成全部面试问题的视频演练',
        route: '/tasks/interview-practice',
        completionType: 'auto',
      },
      {
        id: 8,
        title: 'AI模拟面试',
        subtitle: 'AI评分达到80分即可通过',
        route: '/tasks/phase2/task8',
        completionType: 'auto',
      },
      {
        id: 9,
        title: '我的Offer',
        subtitle: '上传你的Offer文档',
        route: '/tasks/my-offer',
        completionType: 'upload',
      },
    ],
  },
  {
    id: 4,
    name: '登船启航',
    icon: '🚢',
    tasks: [
      {
        id: 10,
        title: '海乘职业资质',
        subtitle: '只保留海员证、海员体检、国际旅行体检、无犯罪记录证明',
        route: '/tasks/Task10',
        completionType: 'upload',
      },
      {
        id: 11,
        title: '申请C1D签证',
        subtitle: '预约面谈、材料准备、面签攻略、出签等待',
        route: '/tasks/Task11',
        completionType: 'auto',
      },
      {
        id: 12,
        title: '登船必带清单',
        subtitle: '检查必须随身携带的文件和物品',
        route: '/tasks/Task12',
        completionType: 'auto',
      },
    ],
  },
]

export default pathData

export const TASK_STATUS = {
  LOCKED: 'locked',
  CURRENT: 'current',
  IN_PROGRESS: 'in_progress',
  REVIEWING: 'reviewing',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
}
