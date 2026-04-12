// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Task1 from './pages/tasks/Task1'
import Task2 from './pages/tasks/Task2'
import Task3 from './pages/tasks/Task3'
import Task4ResumeBuilder from './pages/tasks/phase2/Task4ResumeBuilder'
import Task8MockInterview from './pages/tasks/phase2/Task8MockInterview'
import Task9MyOffer from './pages/MyOffer'
import Academy from './pages/Academy'
import ListeningSpeaking from './pages/academy/ListeningSpeaking'
import ListeningSpeakingCategory from './pages/academy/ListeningSpeakingCategory'
import ListeningSpeakingCourse from './pages/academy/ListeningSpeakingCourse'
import Boarding from './pages/academy/Boarding'
import BoardingDetail from './pages/academy/BoardingDetail'
import Wiki from './pages/academy/Wiki'
import WikiArticle from './pages/academy/WikiArticle'
import Checkin from './pages/academy/Checkin'
import PositionEnglish from './pages/academy/PositionEnglish'
import InterviewQuestions from './pages/academy/InterviewQuestions'
import JobsCenter from './pages/JobsCenter'
import JobPreparation from './pages/JobPreparation'
import JobChannels from './pages/JobChannels'
import CruiseCompanyJobs from './pages/CruiseCompanyJobs'
import CruiseJobPlatforms from './pages/CruiseJobPlatforms'
import LatestRecruitment from './pages/LatestRecruitment'
import YugeReferral from './pages/YugeReferral'
import MyApplications from './pages/MyApplications'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import AssessmentContainer from './components/assessment/AssessmentContainer'
import BoardingMaterials from './pages/BoardingMaterials'
import BottomNav from './components/BottomNav'

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
    '/jobs/applications',
    '/my-offer',
    '/messages',
    '/assessment',
    '/boarding-materials'
  ]

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/Task1" element={<Task1 />} />
          <Route path="/tasks/Task2" element={<Task2 />} />
          <Route path="/tasks/Task3" element={<Task3 />} />
          <Route path="/tasks/phase2/Task4" element={<Task4ResumeBuilder />} />
          <Route path="/tasks/phase2/Task8" element={<Task8MockInterview />} />
          <Route path="/my-offer" element={<Task9MyOffer />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/academy/listening-speaking" element={<ListeningSpeaking />} />
          <Route path="/academy/listening-speaking/:category" element={<ListeningSpeakingCategory />} />
          <Route path="/academy/listening-speaking/:category/:course" element={<ListeningSpeakingCourse />} />
          <Route path="/academy/boarding" element={<Boarding />} />
          <Route path="/academy/boarding/:id" element={<BoardingDetail />} />
          <Route path="/academy/wiki" element={<Wiki />} />
          <Route path="/academy/wiki/:id" element={<WikiArticle />} />
          <Route path="/academy/checkin" element={<Checkin />} />
          <Route path="/academy/position-english" element={<PositionEnglish />} />
          <Route path="/academy/interview-questions" element={<InterviewQuestions />} />
          <Route path="/jobs" element={<JobsCenter />} />
          <Route path="/jobs/preparation" element={<JobPreparation />} />
          <Route path="/jobs/channels" element={<JobChannels />} />
          <Route path="/jobs/company-jobs" element={<CruiseCompanyJobs />} />
          <Route path="/jobs/platforms" element={<CruiseJobPlatforms />} />
          <Route path="/jobs/latest" element={<LatestRecruitment />} />
          <Route path="/jobs/yuge" element={<YugeReferral />} />
          <Route path="/jobs/applications" element={<MyApplications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/assessment" element={<AssessmentContainer />} />
          <Route path="/boarding-materials" element={<BoardingMaterials />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav hideNavPages={hideNavPages} />
      </div>
    </Router>
  )
}

export default App
