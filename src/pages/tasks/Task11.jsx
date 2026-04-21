import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import TaskLayout from '../../components/TaskLayout';

export default function Task11() {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    appointment: true,
    materials: true,
    interview: true,
    waiting: true
  });

  // 切换展开/折叠状态
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 处理完成任务
  const handleCompleteTask = () => {
    // 标记任务11为已完成
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.task11 = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
    console.log('Task11 完成状态已写入:', progress);
  };

  return (
    <TaskLayout taskId={11} taskTitle="申请C1D签证" canComplete={true} onComplete={handleCompleteTask}>
      <div className="space-y-6">
        {/* 顶部核心提示 */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-blue-700 font-medium">
            C1D签证是海乘必备的美国过境签证，用于邮轮工作。请仔细准备材料，确保面签顺利。
          </p>
        </div>

        {/* 预约面谈 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('appointment')}
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              <h3 className="font-medium text-gray-800">预约面谈</h3>
            </div>
            {expandedSections.appointment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.appointment && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">填写 DS-160 表格</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      登录美国签证申请系统填写DS-160表格，上传照片并获取确认页。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">缴纳签证费（中信）</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      通过中信银行缴纳签证申请费，获取缴费收据。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 材料准备 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('materials')}
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              <h3 className="font-medium text-gray-800">材料准备</h3>
            </div>
            {expandedSections.materials ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.materials && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">邮轮公司的派遣函（LOE）</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      由邮轮公司出具的正式派遣函，包含职位、合同期限等信息。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">海员证</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      有效的海员身份证件，确保有效期覆盖工作期限。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">无犯罪记录证明</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      近期开具的无犯罪记录证明，通常有效期为6个月。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">其他材料</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      护照、DS-160确认页、缴费收据、照片等。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 面签攻略 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('interview')}
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              <h3 className="font-medium text-gray-800">面签攻略</h3>
            </div>
            {expandedSections.interview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.interview && (
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">常见问题对策</h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-800">职业真实性</p>
                      <p className="text-gray-600 text-sm mt-1">
                        准备详细的工作经历和邮轮公司信息，证明你确实被雇佣为海乘。
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-800">合同期限</p>
                      <p className="text-gray-600 text-sm mt-1">
                        清楚说明合同起止日期，强调你会在合同结束后返回中国。
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-800">资金状况</p>
                      <p className="text-gray-600 text-sm mt-1">
                        提供足够的资金证明，确保你有能力支付签证费用和初期生活费用。
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-800">归国计划</p>
                      <p className="text-gray-600 text-sm mt-1">
                        强调你在国内的家庭、工作或学习等羁绊，证明你会按时归国。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 出签等待 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('waiting')}
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              <h3 className="font-medium text-gray-800">出签等待</h3>
            </div>
            {expandedSections.waiting ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.waiting && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">拿到签证后</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      仔细核对签证有效期和个人信息，确保所有信息准确无误。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">保存签证</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      将签证页妥善保管，避免损坏或丢失。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">准备登船</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      签证到手后，开始准备登船所需的其他材料和行李。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部空间，防止内容被固定按钮遮挡 */}
        <div className="h-24"></div>
      </div>
    </TaskLayout>
  );
}