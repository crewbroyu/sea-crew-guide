import { Briefcase } from 'lucide-react'

export default function Jobs() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 pt-12 pb-6 px-6">
        <h1 className="text-white text-lg font-bold">求职中心</h1>
        <p className="text-blue-100 text-sm mt-1">海乘岗位信息与求职工具</p>
      </div>
      <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
        <Briefcase size={48} />
        <p className="mt-4 text-sm">求职中心即将上线，敬请期待</p>
      </div>
    </div>
  )
}
