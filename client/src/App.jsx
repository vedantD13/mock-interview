import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import ResumeBuilder from './pages/ResumeBuilder';
import SkillTracker from './pages/SkillTracker';
import MarketInsights from './pages/MarketInsights';
import CareerPath from './pages/CareerPath';
import DashboardLayout from './components/DashboardLayout';

const App = () => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTE: Landing Page */}
        <Route 
          path="/" 
          element={isSignedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        
        {/* APP ROUTES: Wrapped in Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/resume-builder" element={<ResumeBuilder />} />
          <Route path="/skill-tracker" element={<SkillTracker />} />
          <Route path="/market-insights" element={<MarketInsights />} />
          <Route path="/career-path" element={<CareerPath />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;