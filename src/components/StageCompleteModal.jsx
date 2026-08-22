import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import pathData from '../data/pathData'
import { recordStageComplete } from '../store/scoreStore'

const StageCompleteModal = ({ isOpen, onClose, stageId, totalXP }) => {
  const stage = pathData.find(item => item.id === stageId)
  const isLastStage = stageId === pathData.length
  const nextStage = pathData.find(item => item.id === stageId + 1)

  useEffect(() => {
    if (isOpen && stageId && stage) {
      recordStageComplete(stageId, stage.name)
    }
  }, [isOpen, stageId, stage])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={26} />
            </div>

            <h2 className="text-xl font-semibold text-slate-950">阶段已完成</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {stage?.name ? `你已经完成「${stage.name}」阶段。` : '当前阶段进度已更新。'}
            </p>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {isLastStage ? (
                <div>
                  <p className="text-sm font-medium text-slate-950">申请准备路线已走完</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    现在可以回到进度中心，检查简历、证件和面试准备是否已经同步完成。
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">下一阶段</p>
                    <p className="mt-1 text-xs text-slate-500">{nextStage?.name || '继续推进申请'}</p>
                  </div>
                  <ArrowRight size={18} className="text-blue-600" />
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              本阶段累计 +{totalXP || 200} 积分
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {isLastStage ? '查看申请进度中心' : '进入下一阶段'}
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default StageCompleteModal
