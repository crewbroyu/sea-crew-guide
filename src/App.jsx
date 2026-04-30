// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import ErrorBoundary from './components/ErrorBoundary'
import BottomNav from './components/BottomNav'
import AccessGate from './components/AccessGate'
import ProtectedRoute from './components/ProtectedRoute'
import SupabaseTest from './pages/SupabaseTest'

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
              <Route path="/tasks/phase2/Task4" element={<Task4ResumeBuilder />} />
              <Route path="/tasks/phase2/Task5" element={<ProtectedRoute><Task5Training /></ProtectedRoute>} />
              <Route path="/tasks/phase2/Task6" element={<Task6InterviewSkills />} />
              <Route path="/tasks/phase2/Task7" element={<Task7InterviewPractice />} />
              <Route path="/tasks/phase2/Task8" element={<Task8MockInterview />} />
              <Route path="/tasks/phase2/Task9" element={<Task9 />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/listening-speaking" element={<ProtectedRoute><ListeningSpeaking /></ProtectedRoute>} />
              <Route path="/academy/listening-speaking/:category" element={<ProtectedRoute><ListeningSpeakingCategory /></ProtectedRoute>} />
              <Route path="/academy/listening-speaking/:category/:course" element={<ProtectedRoute><ListeningSpeakingCourse /></ProtectedRoute>} />
              <Route path="/academy/boarding" element={<ProtectedRoute><Boarding /></ProtectedRoute>} />
              <Route path="/academy/boarding/detail" element={<ProtectedRoute><BoardingDetail /></ProtectedRoute>} />
              <Route path="/academy/boarding/advice" element={<ProtectedRoute><BoardingAdvice /></ProtectedRoute>} />
              <Route path="/academy/boarding/wechat" element={<ProtectedRoute><BoardingWechat /></ProtectedRoute>} />
              <Route path="/academy/wiki" element={<Wiki />} />
              <Route path="/academy/wiki/:id" element={<WikiArticle />} />

              <Route path="/academy/position-english" element={<ProtectedRoute><PositionEnglish /></ProtectedRoute>} />
              <Route path="/academy/interview-questions" element={<ProtectedRoute><InterviewQuestions /></ProtectedRoute>} />
              <Route path="/academy/scenarios" element={<ProtectedRoute><ScenarioList /></ProtectedRoute>} />
              <Route path="/academy/scenarios/detail" element={<ProtectedRoute><ScenarioDetail /></ProtectedRoute>} />
              <Route path="/academy/port-daily" element={<ProtectedRoute><PortDaily /></ProtectedRoute>} />
              <Route path="/jobs" element={<JobsCenter />} />
              <Route path="/jobs/preparation" element={<ProtectedRoute><JobPreparation /></ProtectedRoute>} />
              <Route path="/jobs/channels" element={<ProtectedRoute><JobChannels /></ProtectedRoute>} />
              <Route path="/jobs/company-jobs" element={<ProtectedRoute><CruiseCompanyJobs /></ProtectedRoute>} />
              <Route path="/jobs/platforms" element={<ProtectedRoute><CruiseJobPlatforms /></ProtectedRoute>} />
              <Route path="/jobs/latest" element={<ProtectedRoute><LatestRecruitment /></ProtectedRoute>} />
              <Route path="/jobs/yuge" element={<ProtectedRoute><YugeReferral /></ProtectedRoute>} />
              <Route path="/jobs/brand-partners" element={<ProtectedRoute><BrandPartners /></ProtectedRoute>} />
              <Route path="/jobs/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-offer" element={<MyOffer />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/assessment" element={<AssessmentContainer />} />
              <Route path="/boarding-materials" element={<BoardingMaterials />} />
              <Route path="/supabase-test" element={<SupabaseTest />} />
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
