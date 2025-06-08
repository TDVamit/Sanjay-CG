import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import CareerAssessment from './components/CareerAssessment';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import CareerRoadmaps from './components/CareerRoadmaps';
import PersonalizedGuidance from './components/PersonalizedGuidance';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
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
            <Route path="/guidance" element={
              <ProtectedRoute>
                <Header />
                <PersonalizedGuidance />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 