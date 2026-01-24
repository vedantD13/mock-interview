import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton, SignInButton } from '@clerk/clerk-react';
import { 
  Video, FileText, BarChart2, Target, Map, ArrowUpRight, 
  LogOut, Loader2, Lock, ShieldAlert 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Define actions that might be locked for guests
  const handleFeatureClick = (path, requiresAuth) => {
    if (requiresAuth && !isSignedIn) {
      // Optional: Trigger a toast notification here saying "Login required"
      alert("Please sign in to access this feature.");
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10 text-blue-400 cursor-pointer" onClick={() => navigate('/')}>
            CareerAI
          </div>
          <div className="space-y-4">
            <SidebarItem icon={<ArrowUpRight size={20} />} label="Dashboard" active />
            <SidebarItem icon={<Video size={20} />} label="Interviews" onClick={() => handleFeatureClick('/interview', false)} />
            
            {/* Protected Features in Sidebar */}
            <SidebarItem icon={<FileText size={20} />} label="Resume Builder" locked={!isSignedIn} onClick={() => handleFeatureClick('/resume-builder', true)} />
            <SidebarItem icon={<BarChart2 size={20} />} label="Market Insights" onClick={() => handleFeatureClick('/market-insights', false)} />
            <SidebarItem icon={<Target size={20} />} label="Skill Tracker" locked={!isSignedIn} onClick={() => handleFeatureClick('/skill-tracker', true)} />
          </div>
        </div>

        {/* Auth Button in Sidebar */}
        <div className="pt-6 border-t border-slate-700">
          {isSignedIn ? (
             // UserButton handles its own sign out
             <div className="flex items-center gap-2 text-slate-400">
                <span className="text-sm">Account</span>
             </div>
          ) : (
            <SignInButton mode="modal">
              <button className="flex items-center gap-3 p-3 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                <span className="font-medium">Sign In</span>
              </button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome back, {isSignedIn ? (user.firstName || "User") : "Guest"}
            </h1>
            <p className="text-gray-500">
              {isSignedIn 
                ? "Here's what's happening with your career progress." 
                : "You are in Guest Mode. Data will not be saved."}
            </p>
          </div>
          
          <div className="scale-125">
             {isSignedIn ? <UserButton afterSignOutUrl="/" /> : (
               <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                 <span className="text-slate-500 font-bold">G</span>
               </div>
             )}
          </div>
        </header>

        {/* Guest Warning Banner */}
        {!isSignedIn && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-800">Limited Guest Access</h3>
              <p className="text-yellow-700 text-sm mt-1">
                You can try out the AI Interview and Market Insights, but your history will not be saved and you cannot use the Resume Builder. 
                <SignInButton mode="modal"><button className="underline font-bold ml-1">Sign in</button></SignInButton> to unlock full access.
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ActionCard 
            title="Start Mock Interview" 
            desc="Practice without saving history" 
            icon={<Video className="w-6 h-6 text-white" />} 
            color="bg-blue-500"
            onClick={() => navigate('/interview')}
          />
          
          {/* Locked / Limited Cards */}
          <ActionCard 
            title="Resume Builder" 
            desc={isSignedIn ? "Manage your resumes" : "Sign in to access"} 
            icon={isSignedIn ? <FileText className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-white" />} 
            color={isSignedIn ? "bg-purple-500" : "bg-slate-400"}
            onClick={() => handleFeatureClick('/resume-builder', true)}
          />
          
          <ActionCard 
            title="Market Data" 
            desc="View general trends" 
            icon={<BarChart2 className="w-6 h-6 text-white" />} 
            color="bg-green-500"
            onClick={() => navigate('/market-insights')}
          />
        </div>

        {/* Feature Sections */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* History / Progress Section - CONDITIONAL RENDER */}
          {isSignedIn ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg mb-4">Your History</h3>
              <div className="space-y-4">
                 <p className="text-gray-500">No interviews recorded yet.</p>
                 {/* Map your actual history items here */}
              </div>
              <button onClick={() => navigate('/skill-tracker')} className="mt-6 text-blue-600 font-medium text-sm hover:underline">View full history</button>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
              <Lock className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="font-semibold text-lg text-slate-700">History is Locked</h3>
              <p className="text-slate-500 text-sm mt-2 mb-4">Sign in to track your interview progress and skill growth over time.</p>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Unlock History</button>
              </SignInButton>
            </div>
          )}

          {/* This section works for everyone but might be generic for guests */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-4">Trending Roles (Live)</h3>
            <div className="space-y-3">
              <JobRole title="Senior Frontend Engineer" company="TechCorp" match={isSignedIn ? 95 : '?'} />
              <JobRole title="Full Stack Developer" company="StartupX" match={isSignedIn ? 88 : '?'} />
            </div>
            <button onClick={() => navigate('/market-insights')} className="mt-6 text-blue-600 font-medium text-sm hover:underline">View market data</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const SidebarItem = ({ icon, label, active, locked, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
      active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } ${locked ? 'opacity-50' : ''}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
    {locked && <Lock size={14} className="ml-auto" />}
  </div>
);

const ActionCard = ({ title, desc, icon, color, onClick }) => (
  <div onClick={onClick} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20`}>
      {icon}
    </div>
    <h3 className="font-bold text-lg text-gray-800">{title}</h3>
    <p className="text-gray-500 text-sm mt-1">{desc}</p>
  </div>
);

const JobRole = ({ title, company, match }) => (
  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
    <div>
      <div className="font-medium text-gray-800">{title}</div>
      <div className="text-xs text-gray-500">{company}</div>
    </div>
    <div className={`px-2 py-1 text-xs font-bold rounded ${match === '?' ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
      {match === '?' ? 'Login to Match' : `${match}% Match`}
    </div>
  </div>
);

export default Dashboard;