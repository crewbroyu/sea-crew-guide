import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, DollarSign, GraduationCap, Clock, ChevronDown, ChevronUp, ExternalLink, AlertTriangle } from 'lucide-react'
import { positionConfig } from '../../data/interviewQuestions'

export default function PositionEnglish() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState('bar_server')
  const [expandedModule, setExpandedModule] = useState(null)

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId)
  }

  const getPositionInfo = (key) => {
    return positionConfig.find(p => p.key === key) || { nameZh: key, nameEn: key, icon: '📋' }
  }

  const currentPosition = getPositionInfo(activeModule)

  const handlePositionChange = (newPosition) => {
    setActiveModule(newPosition)
    setExpandedModule(null)
  }

  // 职位学习资源数据结构 - 预留给8个职位
  const positionResources = {
    bar_server: {
      title: '邮轮酒吧 Bar Server 学习路线',
      description: '专为邮轮酒吧岗位设计的学习路线，帮助你掌握调酒技能和专业英语，提高面试竞争力。',
      color: 'blue',
      bgClass: 'bg-blue-50 border-blue-200',
      textClass: 'text-blue-800',
      accentClass: 'bg-blue-600',
      lightClass: 'bg-blue-100 text-blue-600',
      resources: [
        {
          id: 1,
          title: 'The Working Bartender: Best Beginner Bartending Course',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-working-bartender-best-beginner-bartending-course-online/',
          rating: '★★★★★',
          description: '最适合零基础入门\n\n专门给零经验新手设计\n从 bar tools、基本酒类、经典鸡尾酒开始教\n包含 "如何快速找到 bartender 工作" 内容，很适合面试前准备\n\n官方介绍明确写着：\n"适合 little to no experience 的 aspiring bartenders。"',
          suitable: '零基础入门，重点练 bar tools、基础酒类、经典鸡尾酒、岗位英语表达。'
        },
        {
          id: 2,
          title: 'Bartending Skills Training – Learn to Bartend',
          platform: 'LIQUORexam',
          url: 'https://liquorexam.com/courses/bartending-skills-training/',
          rating: '★★★★★',
          description: '补酒水知识最快\n\n适合：\n零基础建立酒类知识体系\n面试前快速补全专业术语\n\n优势：\n专门讲：\nspirits 分类\nbeer / wine basics\ncocktail recipes\n官方明确提到适合 cruise ship bartending 入门。',
          suitable: '快速建立 spirits / beer / wine / cocktail 专业知识体系，适合面试前补术语。'
        },
        {
          id: 3,
          title: 'BarSmarts Beginner',
          platform: 'BarSmarts',
          url: 'https://barsmarts.com/',
          rating: '★★★★☆',
          description: '如果预算允许\n\n行业认可度高。\n\nReddit bartenders 普遍反馈：\n"BarSmarts 是真正有价值的初学课程之一。"',
          suitable: '行业认可度高，适合预算允许时进阶学习；业内普遍认为很值得学。'
        }
      ],
      learningPlan: [
        '第1周：The Working Bartender（基础入门）',
        '第2周：LIQUORexam Bartending Skills Training（补酒水知识）',
        '第3周：BarSmarts Beginner（进阶学习，预算允许时）'
      ]
    },

    restaurant: {
      title: '邮轮餐厅 Restaurant 学习路线',
      description: '专为邮轮餐厅岗位设计的学习路线，帮助你掌握餐饮服务技能和专业英语，提高面试竞争力。',
      color: 'orange',
      bgClass: 'bg-orange-50 border-orange-200',
      textClass: 'text-orange-800',
      accentClass: 'bg-orange-600',
      lightClass: 'bg-orange-100 text-orange-600',
      resources: [],
      learningPlan: [
        '第1周：餐饮服务基础',
        '第2周：餐厅英语会话',
        '第3周：客户服务技巧',
        '第4周：模拟对话练习'
      ],
      placeholder: {
        title: '🍽️ 餐厅服务员课程筹备中',
        message: '餐厅服务员岗位的学习课程正在准备中...',
        details: [
          '餐厅服务英语会话',
          '西餐服务礼仪',
          '点餐和推荐技巧',
          '处理客户投诉',
          '团队协作要点'
        ]
      }
    },

    housekeeping: {
      title: '邮轮客房 Housekeeping 学习路线',
      description: '专为邮轮客房岗位设计的学习路线，帮助你掌握客房服务技能和专业英语，提高面试竞争力。',
      color: 'teal',
      bgClass: 'bg-teal-50 border-teal-200',
      textClass: 'text-teal-800',
      accentClass: 'bg-teal-600',
      lightClass: 'bg-teal-100 text-teal-600',
      resources: [],
      learningPlan: [
        '第1周：客房清洁基础',
        '第2周：客房服务英语',
        '第3周：房间管理技巧',
        '第4周：特殊清洁要求'
      ],
      placeholder: {
        title: '🧹 客房服务员课程筹备中',
        message: '客房服务员岗位的学习课程正在准备中...',
        details: [
          '客房清洁标准流程',
          '房间布置和整理',
          '客房服务英语',
          '客房安全管理',
          '设备使用和维护'
        ]
      }
    },

    front_office: {
      title: '邮轮前台 Front Office 学习路线',
      description: '专为邮轮前台岗位设计的学习路线，帮助你掌握接待服务技能和专业英语，提高面试竞争力。',
      color: 'indigo',
      bgClass: 'bg-indigo-50 border-indigo-200',
      textClass: 'text-indigo-800',
      accentClass: 'bg-indigo-600',
      lightClass: 'bg-indigo-100 text-indigo-600',
      resources: [],
      learningPlan: [
        '第1周：前台服务基础',
        '第2周：前台英语会话',
        '第3周：客户问题处理',
        '第4周：预订和登记流程'
      ],
      placeholder: {
        title: '🛎️ 前台接待课程筹备中',
        message: '前台接待岗位的学习课程正在准备中...',
        details: [
          '前台接待礼仪',
          '客人登记和入住',
          '问题处理和投诉',
          '前台英语电话用语',
          '信息系统操作'
        ]
      }
    },

    retail: {
      title: '邮轮免税店 Retail Sales 学习路线',
      description: '专为邮轮免税店岗位设计的学习路线，帮助你掌握零售销售技能和专业英语，提高面试竞争力。',
      color: 'purple',
      bgClass: 'bg-purple-50 border-purple-200',
      textClass: 'text-purple-800',
      accentClass: 'bg-purple-600',
      lightClass: 'bg-purple-100 text-purple-600',
      resources: [
        {
          id: 1,
          title: 'Retail Associate Course（基础零售入门）',
          platform: 'Alison',
          url: 'https://alison.com/course/an-introduction-to-retail-associate',
          rating: '★★★★☆',
          description: '适合先打基础，了解零售岗位职责、客户沟通、销售流程。',
          suitable: '零基础入门，了解零售基础知识和客户服务流程。'
        },
        {
          id: 2,
          title: 'Sales Skills（销售技巧）',
          platform: 'Alison',
          url: 'https://alison.com/course/retail-management-merchandising-sales-and-customer-communications',
          rating: '★★★★☆',
          description: '重点学 upselling、cross-selling、销售沟通技巧。',
          suitable: '学习销售技巧，提高客户沟通和成交能力。'
        },
        {
          id: 3,
          title: 'Cruise Retail Academy（邮轮零售专项）',
          platform: 'Cruise Retail Academy',
          url: 'https://www.cruiseretailacademy.com/training',
          rating: '★★★★★',
          description: '最对口邮轮免税店岗位，专门针对邮轮 retail。',
          suitable: '邮轮免税店专项训练，最符合岗位需求。'
        },
        {
          id: 4,
          title: 'Sales English / Customer Service English（销售英语）',
          platform: 'Alison',
          url: 'https://alison.com/course/retail-management-customer-interactions',
          rating: '★★★★☆',
          description: '专练客户接待英语、投诉处理英语。',
          suitable: '提高客户服务英语表达能力。'
        }
      ],
      learningPlan: [
        '第1周：零售基础 + 销售技巧',
        '第2周：Cruise Retail Academy 专项课程',
        '第3周：产品知识（香水/手表/酒类）',
        '第4周：销售英语 + 模拟对话'
      ]
    },

    youth_staff: {
      title: '邮轮 Youth Staff 学习路线',
      description: '专为邮轮青少年活动专员岗位设计的学习路线，帮助你掌握儿童照护技能和专业英语，提高面试竞争力。',
      color: 'green',
      bgClass: 'bg-green-50 border-green-200',
      textClass: 'text-green-800',
      accentClass: 'bg-green-600',
      lightClass: 'bg-green-100 text-green-600',
      resources: [
        {
          id: 1,
          title: '儿童基础（必须）',
          subtitle: 'Childcare and Young People Development',
          platform: 'Alison（免费）',
          url: 'https://alison.com/course/childcare-and-young-people-development',
          description: '你能学到：\n\n不同年龄孩子怎么带\n常见问题（哭闹、不听话）怎么处理\n基础安全意识\n\n👉 这个是地基课，必须上',
          suitable: '零基础入门，学习儿童照护基础知识，是必须的基础课程。'
        },
        {
          id: 2,
          title: 'Youth Staff思维（别当保姆）',
          subtitle: 'Basics of Youth Work and Leadership',
          platform: 'Alison',
          url: 'https://alison.com/course/basics-of-youth-work-and-leadership',
          description: '你能学到：\n\n怎么带一群孩子（不是带一个）\n怎么控场、组织活动\nyouth staff的角色定位\n\n👉 很关键一句：\n你是活动带动者，不是看孩子的',
          suitable: '学习 Youth Staff 的核心思维，理解角色定位，掌握活动组织技巧。'
        },
        {
          id: 3,
          title: '高频英语（你最该补的）',
          subtitle: 'Customer Service English Skills',
          platform: 'Alison',
          url: 'https://alison.com/course/customer-service-english-skills',
          description: '重点学这些句型：\n\n指令类：\n"Line up please"\n"Let\'s start the game"\n管理类：\n"No running please"\n"Take turns"\n安抚类：\n"It\'s okay, don\'t worry"\n家长沟通：\n"Your child had a great time today"\n\n👉 这个课的价值不是考试，是直接开口用',
          suitable: '学习 Youth Staff 岗位高频英语表达，提高实际工作中的沟通能力。'
        },
        {
          id: 4,
          title: '活动设计（面试会用）',
          subtitle: 'Youth Ministry Training',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/how-to-build-a-youth-ministry/',
          description: '你能学到：\n\n怎么设计小游戏\n怎么带气氛\n怎么让孩子参与\n\n👉 面试时让你"带活动"，这个直接用得上',
          suitable: '学习活动设计技巧，为面试中的活动演示做准备，提高竞争力。'
        }
      ],
      learningPlan: [
        '第1周：儿童基础（必须）',
        '第2周：Youth Staff思维（别当保姆）',
        '第3周：高频英语（你最该补的）',
        '第4周：活动设计（面试会用，可选）'
      ]
    },

    kitchen: {
      title: '邮轮厨房 Kitchen Steward 学习路线',
      description: '专为邮轮厨房帮厨岗位设计的学习路线，帮助你掌握厨房工作技能和专业英语，提高面试竞争力。',
      color: 'red',
      bgClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-800',
      accentClass: 'bg-red-600',
      lightClass: 'bg-red-100 text-red-600',
      resources: [],
      learningPlan: [
        '第1周：厨房安全与卫生',
        '第2周：厨房设备使用',
        '第3周：基础烹饪技巧',
        '第4周：厨房英语术语'
      ],
      placeholder: {
        title: '👨‍🍳 厨房帮厨课程筹备中',
        message: '厨房帮厨岗位的学习课程正在准备中...',
        details: [
          '厨房安全与卫生标准',
          '厨房设备操作和维护',
          '食材处理基础',
          '厨房英语术语',
          '团队协作和沟通'
        ]
      }
    },

    utility: {
      title: '邮轮后勤 Utility 学习路线',
      description: '专为邮轮后勤清洁岗位设计的学习路线，帮助你掌握后勤工作技能和专业英语，提高面试竞争力。',
      color: 'gray',
      bgClass: 'bg-gray-50 border-gray-200',
      textClass: 'text-gray-800',
      accentClass: 'bg-gray-600',
      lightClass: 'bg-gray-100 text-gray-600',
      resources: [],
      learningPlan: [
        '第1周：清洁流程基础',
        '第2周：清洁剂和设备使用',
        '第3周：后勤服务英语',
        '第4周：安全规范和团队协作'
      ],
      placeholder: {
        title: '🧤 后勤清洁课程筹备中',
        message: '后勤清洁岗位的学习课程正在准备中...',
        details: [
          '清洁标准操作流程',
          '清洁剂和设备使用',
          '公共区域维护',
          '后勤服务英语',
          '安全规范和团队协作'
        ]
      }
    }
  }

  const currentData = positionResources[activeModule]

  const getModuleButtonClass = (key) => {
    const isActive = activeModule === key
    const position = getPositionInfo(key)
    const colorMap = {
      bar_server: 'bg-blue-600',
      restaurant: 'bg-orange-600',
      housekeeping: 'bg-teal-600',
      front_office: 'bg-indigo-600',
      retail: 'bg-purple-600',
      youth_staff: 'bg-green-600',
      kitchen: 'bg-red-600',
      utility: 'bg-gray-600'
    }
    return isActive 
      ? `${colorMap[key]} text-white`
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => navigate('/academy')}
            className="text-white/80 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-white/60 text-sm">海乘学院</span>
        </div>
        <h1 className="text-white text-xl font-bold">岗位英语课程</h1>
        <p className="text-white/80 text-sm mt-1">
          选择目标职位，开始系统学习
        </p>
      </div>

      {/* 职位选择标签栏 */}
      <div className="px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex overflow-x-auto gap-2 pb-2">
          {positionConfig.map((position) => (
            <button
              key={position.key}
              onClick={() => handlePositionChange(position.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${getModuleButtonClass(position.key)}`}
            >
              <span>{position.icon}</span>
              <span className="ml-1">{position.nameZh}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 主要内容 */}
      <div className="px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {/* 当前职位介绍 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${currentData.lightClass} rounded-full flex items-center justify-center text-2xl`}>
                {currentPosition.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{currentData.title}</h2>
                <p className="text-gray-500 text-sm">{currentPosition.nameEn}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              {currentData.description}
            </p>
            
            {/* 学习计划 */}
            {currentData.learningPlan && currentData.learningPlan.length > 0 && (
              <div className={`${currentData.bgClass} border rounded-lg p-4`}>
                <h3 className={`font-medium ${currentData.textClass} mb-2`}>最佳学习顺序（建议）</h3>
                <p className={`${currentData.textClass} text-sm mb-2`}>每天 1–2 小时：</p>
                <ul className={`list-disc list-inside space-y-1 ${currentData.textClass} text-sm`}>
                  {currentData.learningPlan.map((plan, index) => (
                    <li key={index}>{plan}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 课程内容 */}
          {currentData.resources && currentData.resources.length > 0 ? (
            <div className="space-y-4">
              {currentData.resources.map((resource) => (
                <div key={resource.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleModule(`${activeModule}-${resource.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${currentData.lightClass} rounded-full flex items-center justify-center`}>
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{resource.title}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          {resource.platform && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{resource.platform}</span>
                          )}
                          {resource.rating && (
                            <span className="text-amber-500 font-medium">{resource.rating}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedModule === `${activeModule}-${resource.id}` ? 
                      <ChevronUp size={20} className="text-gray-400" /> : 
                      <ChevronDown size={20} className="text-gray-400" />
                    }
                  </div>
                  
                  {expandedModule === `${activeModule}-${resource.id}` && (
                    <div className="p-4 border-t border-gray-100">
                      <div className={`${currentData.bgClass} border ${currentData.textClass} rounded-lg p-3 mb-4 text-sm`}>
                        <span className="font-medium">外站课程，需自行注册</span>
                      </div>
                      <p className="text-gray-600 mb-4 whitespace-pre-line">{resource.description}</p>
                      {resource.suitable && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">适合：</h4>
                          <p className="text-gray-600 text-sm">{resource.suitable}</p>
                        </div>
                      )}
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <ExternalLink size={16} />
                        访问课程链接
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* 占位课程内容 */
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{currentData.placeholder.title}</h3>
                <p className="text-gray-600 mb-4">{currentData.placeholder.message}</p>
                
                <div className="text-left bg-gray-50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-3">即将上线的课程内容：</h4>
                  <ul className="space-y-2">
                    {currentData.placeholder.details.map((detail, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-600 text-sm">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 学习提示 */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-800 mb-2">💡 学习提示</h3>
            {currentData.resources && currentData.resources.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
                <li>建议按照推荐顺序学习，循序渐进</li>
                <li>每天坚持学习 1-2 小时，保持学习连续性</li>
                <li>结合实际场景练习，提高应用能力</li>
                <li>定期复习，巩固所学知识</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
                <li>该岗位课程正在筹备中，敬请期待</li>
                <li>你可以先学习其他已有课程的岗位</li>
                <li>或先完成任务2，选择其他已有课程的岗位</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}