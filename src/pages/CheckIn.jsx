import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { updateMyProfile } from '../services/profileService'
import { getTodayCheckin, getAllCheckins, createCheckin } from '../services/checkinService'
import {
  ArrowLeft, Mic, Play, CheckCircle2, Flame, Calendar, Award
} from 'lucide-react'

const sentences = [
  {
    en: "Good morning! Welcome aboard. How may I assist you today?",
    zh: "早上好！欢迎登船。今天有什么可以帮您的吗？",
  },
  {
    en: "Excuse me, dinner will be served in the main dining room at 7 PM.",
    zh: "打扰一下，晚餐将在主餐厅7点供应。",
  },
  {
    en: "Would you like me to arrange a shore excursion for you?",
    zh: "您需要我为您安排一次岸上观光吗？",
  },
  {
    en: "Please let me know if you need extra towels or pillows.",
    zh: "如果您需要额外的毛巾或枕头，请告诉我。",
  },
  {
    en: "The swimming pool is located on Deck 9, open from 8 AM to 10 PM.",
    zh: "游泳池位于9层甲板，开放时间为早8点至晚10点。",
  },
  {
    en: "I apologize for the inconvenience. Let me resolve this for you right away.",
    zh: "很抱歉给您带来不便，我马上为您解决。",
  },
  {
    en: "Your cabin has been prepared. Here is your key card.",
    zh: "您的舱房已准备好，这是您的房卡。",
  },
]

function getTodaySentence() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  )
  return sentences[dayOfYear % sentences.length]
}

export default function CheckIn() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuthStore()
  const [completed, setCompleted] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalDays, setTotalDays] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [weekDays, setWeekDays] = useState([])

  const todaySentence = getTodaySentence()

  const fetchCheckinData = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)

      // 查今天是否已打卡
      const today = new Date().toISOString().split('T')[0]
      const todayCheckin = await getTodayCheckin(today)

      if (todayCheckin) {
        setCompleted(true)
      }

      // 查所有打卡记录算连续天数和总天数
      const allCheckins = await getAllCheckins()

      if (allCheckins && allCheckins.length > 0) {
        setTotalDays(allCheckins.length)

        // 算连续打卡天数
        let s = 0
        const dates = allCheckins.map((c) => c.checked_at)
        const todayDate = new Date(today)

        for (let i = 0; i < dates.length; i++) {
          const expected = new Date(todayDate)
          expected.setDate(expected.getDate() - i)
          const expectedStr = expected.toISOString().split('T')[0]
          if (dates.includes(expectedStr)) {
            s++
          } else {
            break
          }
        }
        setStreak(s)
      }

      // 算本周打卡情况
      const now = new Date()
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - dayOfWeek + 1)

      const week = []
      const checkedDates = allCheckins ? allCheckins.map((c) => c.checked_at) : []

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        const dayNames = ['一', '二', '三', '四', '五', '六', '日']
        week.push({
          label: dayNames[i],
          date: dateStr,
          checked: checkedDates.includes(dateStr),
          isToday: dateStr === today,
          isFuture: d > now,
        })
      }
      setWeekDays(week)
    } catch (err) {
      console.error('fetchCheckinData error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchCheckinData()
    } else {
      setLoading(false)
    }
  }, [fetchCheckinData, user?.id])

  const handleCheckIn = async () => {
    if (submitting || completed) return
    try {
      setSubmitting(true)
      const today = new Date().toISOString().split('T')[0]

      await createCheckin({
        checked_at: today,
        sentence: todaySentence.en,
        xp_earned: 10,
      })

      // 更新 XP
      const newXp = (profile?.xp || 0) + 10
      const newLevel = Math.floor(newXp / 100) + 1
      await updateMyProfile({ xp: newXp, level: newLevel })

      setProfile({ ...profile, xp: newXp, level: newLevel })
      setCompleted(true)
      setStreak((s) => s + 1)
      setTotalDays((t) => t + 1)

      // 更新本周状态
      setWeekDays((prev) =>
        prev.map((d) =>
          d.isToday ? { ...d, checked: true } : d
        )
      )
    } catch (err) {
      console.error('handleCheckIn error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white text-lg font-bold">每日打卡</h1>
        </div>
        <p className="text-orange-200 text-sm">坚持练习，日积月累</p>

        {/* 统计 */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame size={18} className="text-yellow-300" />
              <span className="text-white text-xl font-bold">{streak}</span>
            </div>
            <p className="text-orange-200 text-xs mt-1">连续打卡</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Calendar size={18} className="text-yellow-300" />
              <span className="text-white text-xl font-bold">{totalDays}</span>
            </div>
            <p className="text-orange-200 text-xs mt-1">累计打卡</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Award size={18} className="text-yellow-300" />
              <span className="text-white text-xl font-bold">{totalDays * 10}</span>
            </div>
            <p className="text-orange-200 text-xs mt-1">获得XP</p>
          </div>
        </div>
      </div>

      {/* 本周打卡日历 */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">本周打卡</p>
          <div className="flex justify-between">
            {weekDays.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1.5">
                <span className={`text-xs ${d.isToday ? 'text-orange-600 font-bold' : 'text-gray-400'}`}>
                  {d.label}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  d.checked
                    ? 'bg-orange-500'
                    : d.isToday
                    ? 'bg-orange-100 border-2 border-orange-400'
                    : d.isFuture
                    ? 'bg-gray-50'
                    : 'bg-gray-100'
                }`}>
                  {d.checked ? (
                    <CheckCircle2 size={16} className="text-white" />
                  ) : d.isToday ? (
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 今日练习 */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {completed ? (
              <CheckCircle2 size={40} className="text-green-500" />
            ) : (
              <Mic size={40} className="text-orange-500" />
            )}
          </div>

          <h2 className="font-bold text-gray-800 text-lg mb-2">
            {completed ? '今日已打卡 ✅' : '今日口语练习'}
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            {completed
              ? '太棒了！明天继续保持 🎉'
              : '跟读以下句子，练习口语发音'}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-gray-800 font-medium">
              "{todaySentence.en}"
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {todaySentence.zh}
            </p>
          </div>

          {!completed && (
            <>
              <button className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mb-3">
                <Play size={16} />
                播放示范
              </button>

              <button
                onClick={handleCheckIn}
                disabled={submitting}
                className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {submitting ? '提交中...' : '完成打卡 +10XP'}
              </button>
            </>
          )}

          {completed && (
            <button
              onClick={() => navigate('/tasks')}
              className="w-full py-3 bg-orange-50 text-orange-600 rounded-xl text-sm font-medium mt-2"
            >
              继续做任务 →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}