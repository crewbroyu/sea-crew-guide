import { Volume2 } from 'lucide-react'

export default function EdgeReadAloudHint() {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
      <Volume2 size={14} className="mt-0.5 shrink-0 text-slate-400" />
      用 Edge 打开本页时，可长按或右键英文，选择“大声朗读”试听自然发音。
    </p>
  )
}
