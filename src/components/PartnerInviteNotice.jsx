import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccessStore } from '../store/accessStore'
import { partnerDirectory } from '../services/partnerWorkspaceService'

function NoticeSession() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let active = true
    let sequence = 0
    const refresh = async () => {
      const id = ++sequence
      try {
        const result = await partnerDirectory('pending_count')
        if (active && id === sequence) setCount(result.pending_count)
      } catch {
        if (active && id === sequence) setCount(0)
      }
    }
    refresh()
    const timer = window.setInterval(() => { if (!document.hidden) refresh() }, 30000)
    window.addEventListener('focus', refresh)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  if (!count) return null
  return <Link to="/partner" className="block rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
    <strong>你有 {count} 条合作邀请待确认</strong>
    <p className="mt-1 text-sm">查看接收方和共享范围，自主选择同意或拒绝。查看邀请不会自动授权。</p>
  </Link>
}

export default function PartnerInviteNotice() {
  const { userId, isRegistered, accessStatus } = useAccessStore()
  if (!userId || !isRegistered || accessStatus !== 'active') return null
  return <NoticeSession key={userId} />
}
