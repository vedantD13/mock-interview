import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import Home from './pages/Home';
import Interview from './pages/Interview';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        
        {/* GLOBAL HEADER */}
        <header className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Interviewer
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-md">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;