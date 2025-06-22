import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Component to handle chat visibility based on route
const ChatButton = () => {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Define main pages where chat should be visible
  const mainPages = ['/', '/assessment', '/resume-analyzer', '/roadmaps', '/personalized-guidance'];
  const shouldShowChat = mainPages.includes(location.pathname);
  
  if (!shouldShowChat) return null;
  
  return (
    <>
      {/* Global Chat Button - Fixed positioning, appears on all main routes */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-125 transition-all duration-300 relative"
          style={{ 
            backgroundColor: '#39FF14',
            boxShadow: '0 10px 30px rgba(57, 255, 20, 0.6), 0 0 60px rgba(57, 255, 20, 0.3)'
          }}
          title="Open Chat"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-black relative z-10" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Global Chat Popup */}
      <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

function App() {
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

          {/* Chat Component with conditional visibility */}
          <ChatButton />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 