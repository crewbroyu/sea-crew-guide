import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import Tasks from './pages/Tasks'
import JobSelect from './pages/JobSelect'
import Academy from './pages/Academy'
import CheckIn from './pages/CheckIn'
import Profile from './pages/Profile'

// 不显示底部导航的页面
const hideNavPages = ['/login', '/assessment', '/job-select']

function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-sm px-6 py-5 text-center">
        <h1 className="text-lg font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500 mt-2">页面建设中</p>
      </div>
    </div>
  )
}

function AppLayout() {
  const { user } = useAuthStore()
  const location = useLocation()
  const showNav = user && !hideNavPages.includes(location.pathname)

  return (
    <div className={showNav ? 'pb-16' : ''}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/assessment" element={user ? <Assessment /> : <Navigate to="/login" />} />
        <Route path="/tasks" element={user ? <Tasks /> : <Navigate to="/login" />} />
        <Route path="/job-select" element={user ? <JobSelect /> : <Navigate to="/login" />} />
        <Route path="/academy" element={user ? <Academy /> : <Navigate to="/login" />} />
        <Route path="/academy/job-english" element={user ? <PlaceholderPage title="岗位英语" /> : <Navigate to="/login" />} />
        <Route path="/academy/interview" element={user ? <PlaceholderPage title="面试训练" /> : <Navigate to="/login" />} />
        <Route path="/academy/boarding" element={user ? <PlaceholderPage title="登船手续" /> : <Navigate to="/login" />} />
        <Route path="/academy/wiki" element={user ? <PlaceholderPage title="邮轮百科" /> : <Navigate to="/login" />} />
        <Route path="/checkin" element={user ? <CheckIn /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/route-select" element={user ? <PlaceholderPage title="确定申请路线" /> : <Navigate to="/login" />} />
        <Route path="/resume" element={user ? <PlaceholderPage title="我的简历" /> : <Navigate to="/login" />} />
        <Route path="/my-offer" element={user ? <PlaceholderPage title="我的 Offer" /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <PlaceholderPage title="设置" /> : <Navigate to="/login" />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}