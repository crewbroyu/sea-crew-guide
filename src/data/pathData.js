const pathData = [
  {
    id: 1,
    name: '决定出发',
    icon: '🚀',
    tasks: [
      {
        id: 1,
        title: '海乘适配评估',
        subtitle: '完成六维职业测评，了解推荐岗位、短板和准备优先级',
        route: '/assessment',
        completionType: 'auto', // auto=自动判定, upload=上传审核
      },
      {
        id: 2,
        title: '选择目标岗位',
        subtitle: '根据测评结果，选定你的目标岗位',
        route: '/tasks/Task2',
        completionType: 'auto',
      },
      {
        id: 3,
        title: '确定申请路线',
        subtitle: '选择适合你的申请方式和路径',
        route: '/tasks/Task3',
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
        route: '/tasks/phase2/Task4',
        completionType: 'auto',
      },
      {
        id: 5,
        title: '学习岗位知识',
        subtitle: '围绕目标岗位完成一页纸、准备清单和补充资源',
        route: '/tasks/phase2/Task5',
        completionType: 'upload',
        timeLimit: 30,
      },
      {
        id: 6,
        title: '面试技巧学习',
        subtitle: '把真实经历打磨成可用于 AI 模拟面试的答案卡',
        route: '/tasks/phase2/Task6',
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
        title: '面试训练中心',
        subtitle: '集中完成题库学习、单题语音练习和完整 AI 模拟',
        route: '/tasks/phase2/Task7',
        completionType: 'auto',
      },
      {
        id: 8,
        title: '真实面试跟进',
        subtitle: '记录面试邀请、现场问题、结果和下一步',
        route: '/tasks/phase2/Task8',
        completionType: 'auto',
      },
      {
        id: 9,
        title: '核对我的 Offer',
        subtitle: '记录岗位、合同、收入与登船安排，识别待确认条款',
        route: '/my-offer',
        completionType: 'auto',
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
        title: '准备登船证件',
        subtitle: '按公司和航线要求管理办理状态、有效期与备注',
        route: '/tasks/Task10',
        completionType: 'auto',
      },
      {
        id: 11,
        title: '确认签证与通行许可',
        subtitle: '根据航线判断要求并记录实际办理进度',
        route: '/tasks/Task11',
        completionType: 'auto',
      },
      {
        id: 12,
        title: '完成登船出发准备',
        subtitle: '汇总 Offer、证件、签证、行程与随身文件状态',
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
