import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Outlet />
      <TabBar />
    </div>
  )
}