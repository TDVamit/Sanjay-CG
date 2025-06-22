import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import CareerAssessment from './components/CareerAssessment';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import CareerRoadmaps from './components/CareerRoadmaps';
import RoadmapDetail from './components/RoadmapDetail';
import RoadmapFullscreen from './components/RoadmapFullscreen';
import PersonalizedGuidance from './components/PersonalizedGuidance';
import GuidanceAgentDetail from './components/GuidanceAgentDetail';
import ChatPopup from './components/ChatPopup';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Redirect old guidance path to new one */}
            <Route path="/guidance" element={<Navigate to="/personalized-guidance" replace />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Header />
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/assessment" element={
              <ProtectedRoute>
                <Header />
                <CareerAssessment />
              </ProtectedRoute>
            } />
            <Route path="/resume-analyzer" element={
              <ProtectedRoute>
                <Header />
                <ResumeAnalyzer />
              </ProtectedRoute>
            } />
            <Route path="/roadmaps" element={
              <ProtectedRoute>
                <Header />
                <CareerRoadmaps />
              </ProtectedRoute>
            } />
            <Route path="/roadmaps/:id" element={
              <ProtectedRoute>
                <Header />
                <RoadmapDetail />
              </ProtectedRoute>
            } />
            <Route path="/roadmaps/:id/fullscreen" element={
              <ProtectedRoute>
                <RoadmapFullscreen />
              </ProtectedRoute>
            } />
            <Route path="/personalized-guidance" element={
              <ProtectedRoute>
                <Header />
                <PersonalizedGuidance />
              </ProtectedRoute>
            } />
            <Route path="/guidance-agents/:id" element={
              <ProtectedRoute>
                <Header />
                <GuidanceAgentDetail />
              </ProtectedRoute>
            } />
          </Routes>

          {/* Global Chat Button - Fixed positioning, appears on all protected routes */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-125 transition-all duration-300 relative"
              style={{ 
                backgroundColor: '#39FF14',
                boxShadow: '0 10px 30px rgba(57, 255, 20, 0.6), 0 0 60px rgba(57, 255, 20, 0.3)'
              }}
              title="Open Chat"
            >
              <svg className="w-7 h-7 text-black relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Global Chat Popup */}
          <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 