// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview'; 
import ResumeBuilder from './pages/ResumeBuilder';
import MarketInsights from './pages/MarketInsights';
import SkillTracker from './pages/SkillTracker';
import CareerPath from './pages/CareerPath';

// Wrapper for routes that STRICTLY require login (like saving data/profile)
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const { isSignedIn } = useUser();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* PUBLIC ROUTES (Guest Access Allowed) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/market-insights" element={<MarketInsights />} />
        
        {/* PROTECTED ROUTES (Login Required) */}
        {/* We restrict these because they rely heavily on saved user data */}
        <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
        <Route path="/skill-tracker" element={<ProtectedRoute><SkillTracker /></ProtectedRoute>} />
        <Route path="/career-path" element={<ProtectedRoute><CareerPath /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;