// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import ErrorBoundary from './components/ErrorBoundary'
import BottomNav from './components/BottomNav'
import AccessGate from './components/AccessGate'
import RequireLogin from './components/RequireLogin'
import RequireActivation from './components/RequireActivation'
import CompletionHint from './components/CompletionHint'
import DebugPanel from './components/DebugPanel'

// 动态导入大型组件
const Task1 = lazy(() => import('./pages/tasks/Task1'))
const Task2 = lazy(() => import('./pages/tasks/Task2'))
const Task3 = lazy(() => import('./pages/tasks/Task3'))
const Task10 = lazy(() => import('./pages/tasks/Task10'))
const Task11 = lazy(() => import('./pages/tasks/Task11'))
const Task12 = lazy(() => import('./pages/tasks/Task12'))
const Task4ResumeBuilder = lazy(() => import('./pages/tasks/phase2/Task4ResumeBuilder'))
const Task5Training = lazy(() => import('./pages/tasks/phase2/Task5Training'))
const Task6InterviewSkills = lazy(() => import('./pages/tasks/phase2/Task6InterviewSkills'))
const Task7InterviewPractice = lazy(() => import('./pages/tasks/phase2/Task7InterviewPractice'))
const Task8MockInterview = lazy(() => import('./pages/tasks/phase2/Task8MockInterview'))
const Task9 = lazy(() => import('./pages/tasks/phase2/Task9ScenarioTraining'))
const ActivationCodeGenerator = lazy(() => import('./pages/ActivationCodeGenerator'))

const Academy = lazy(() => import('./pages/Academy'))
const ListeningSpeaking = lazy(() => import('./pages/academy/ListeningSpeaking'))
const ListeningSpeakingCategory = lazy(() => import('./pages/academy/ListeningSpeakingCategory'))
const ListeningSpeakingCourse = lazy(() => import('./pages/academy/ListeningSpeakingCourse'))
const Boarding = lazy(() => import('./pages/academy/Boarding'))
const BoardingDetail = lazy(() => import('./pages/academy/BoardingDetail'))
const BoardingAdvice = lazy(() => import('./pages/academy/BoardingAdvice'))
const BoardingWechat = lazy(() => import('./pages/academy/BoardingWechat'))
const Wiki = lazy(() => import('./pages/academy/Wiki'))
const WikiArticle = lazy(() => import('./pages/academy/WikiArticle'))
const PositionEnglish = lazy(() => import('./pages/academy/PositionEnglish'))
const InterviewQuestions = lazy(() => import('./pages/academy/InterviewQuestions'))
const ScenarioList = lazy(() => import('./pages/academy/ScenarioList'))
const ScenarioDetail = lazy(() => import('./pages/academy/ScenarioDetail'))
const PortDaily = lazy(() => import('./pages/academy/PortDaily'))

const JobsCenter = lazy(() => import('./pages/JobsCenter'))
const JobPreparation = lazy(() => import('./pages/JobPreparation'))
const JobChannels = lazy(() => import('./pages/JobChannels'))
const CruiseCompanyJobs = lazy(() => import('./pages/CruiseCompanyJobs'))
const CruiseJobPlatforms = lazy(() => import('./pages/CruiseJobPlatforms'))
const LatestRecruitment = lazy(() => import('./pages/LatestRecruitment'))
const YugeReferral = lazy(() => import('./pages/YugeReferral'))
const MyApplications = lazy(() => import('./pages/MyApplications'))
const BrandPartners = lazy(() => import('./pages/BrandPartners'))

const MyOffer = lazy(() => import('./pages/MyOffer'))
const Profile = lazy(() => import('./pages/Profile'))
const Messages = lazy(() => import('./pages/Messages'))
const Resume = lazy(() => import('./pages/Resume'))
const AssessmentContainer = lazy(() => import('./components/assessment/AssessmentContainer'))
const BoardingMaterials = lazy(() => import('./pages/BoardingMaterials'))

function App() {
  const hideNavPages = [
    '/tasks/*',
    '/academy/*',
    '/jobs/preparation',
    '/jobs/channels',
    '/jobs/company-jobs',
    '/jobs/platforms',
    '/jobs/latest',
    '/jobs/yuge',
    '/jobs/brand-partners',
    '/jobs/applications',
    '/my-offer',
    '/messages',
    '/assessment',
    '/boarding-materials'
  ]

  return (
    <ErrorBoundary>
      <Router>
        <AccessGate />
        <CompletionHint />
        <DebugPanel />
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 mb-4"></div>
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/Task1" element={<Task1 />} />
              <Route path="/tasks/Task2" element={<Task2 />} />
              <Route path="/tasks/Task3" element={<Task3 />} />
              <Route path="/tasks/Task10" element={<Task10 />} />
              <Route path="/tasks/Task11" element={<Task11 />} />
              <Route path="/tasks/Task12" element={<Task12 />} />
              <Route path="/tasks/phase2/Task4" element={<RequireLogin><Task4ResumeBuilder /></RequireLogin>} />
              <Route path="/tasks/phase2/Task5" element={<Task5Training />} />
              <Route path="/tasks/phase2/Task6" element={<Task6InterviewSkills />} />
              <Route path="/tasks/phase2/Task7" element={<Task7InterviewPractice />} />
              <Route path="/tasks/phase2/Task8" element={<Task8MockInterview />} />
              <Route path="/tasks/phase2/Task9" element={<Task9 />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/listening-speaking" element={<ListeningSpeaking />} />
              <Route path="/academy/listening-speaking/:category" element={<ListeningSpeakingCategory />} />
              <Route path="/academy/listening-speaking/:category/:course" element={<ListeningSpeakingCourse />} />
              <Route path="/academy/boarding" element={<Boarding />} />
              <Route path="/academy/boarding/detail" element={<BoardingDetail />} />
              <Route path="/academy/boarding/advice" element={<BoardingAdvice />} />
              <Route path="/academy/boarding/wechat" element={<BoardingWechat />} />
              <Route path="/academy/wiki" element={<Wiki />} />
              <Route path="/academy/wiki/:id" element={<WikiArticle />} />

              <Route path="/academy/position-english" element={<PositionEnglish />} />
              <Route path="/academy/interview-questions" element={<InterviewQuestions />} />
              <Route path="/academy/scenarios" element={<ScenarioList />} />
              <Route path="/academy/scenarios/detail" element={<ScenarioDetail />} />
              <Route path="/academy/port-daily" element={<PortDaily />} />
              <Route path="/jobs" element={<JobsCenter />} />
              <Route path="/jobs/preparation" element={<JobPreparation />} />
              <Route path="/jobs/channels" element={<JobChannels />} />
              <Route path="/jobs/company-jobs" element={<CruiseCompanyJobs />} />
              <Route path="/jobs/platforms" element={<CruiseJobPlatforms />} />
              <Route path="/jobs/latest" element={<LatestRecruitment />} />
              <Route path="/jobs/yuge" element={<YugeReferral />} />
              <Route path="/jobs/brand-partners" element={<BrandPartners />} />
              <Route path="/jobs/applications" element={<RequireLogin><MyApplications /></RequireLogin>} />
              <Route path="/profile" element={<RequireLogin><Profile /></RequireLogin>} />
              <Route path="/my-offer" element={<RequireLogin><MyOffer /></RequireLogin>} />
              <Route path="/resume" element={<RequireLogin><Resume /></RequireLogin>} />
              <Route path="/messages" element={<RequireLogin><Messages /></RequireLogin>} />
              <Route path="/assessment" element={<AssessmentContainer />} />
              <Route path="/boarding-materials" element={<RequireActivation><BoardingMaterials /></RequireActivation>} />
              <Route path="/generate-codes" element={<RequireActivation><ActivationCodeGenerator /></RequireActivation>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <BottomNav hideNavPages={hideNavPages} />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
