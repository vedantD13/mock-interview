import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, Code, Server, Database, Brain, Loader2, LayoutDashboard } from 'lucide-react';
import { useUser } from "@clerk/clerk-react";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Get the current logged-in user from Clerk
  const { user } = useUser();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    
    // INTEGRATION: Send the real User ID if logged in, otherwise 'guest'
    formData.append('userId', user ? user.id : 'guest');

    try {
      const res = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/interview', { state: { sessionId: data.sessionId } });
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  const startTopicInterview = async (topic) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: 'new_topic_session',
          topic: topic,
          userMessage: "START_INTERVIEW",
          // INTEGRATION: Send the real User ID if logged in, otherwise 'guest'
          userId: user ? user.id : 'guest'
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        navigate('/interview', { state: { sessionId: data.sessionId } });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* DASHBOARD BUTTON */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:shadow-md transition-all group"
        >
          <LayoutDashboard size={20} className="text-indigo-600 group-hover:scale-110 transition-transform" />
          My Dashboard
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-lg font-semibold text-gray-700">Preparing your Interview...</p>
        </div>
      )}

      <div className="text-center max-w-3xl mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
          <Sparkles size={16} />
          <span>AI-Powered Prep</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Master Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Interview</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Upload your resume for a personalized drill, or pick a specific domain to practice.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
        
        {/* OPTION 1: RESUME UPLOAD */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 hover:shadow-2xl transition-all group">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Personalized Interview</h2>
          <p className="text-gray-500 mb-8">We'll analyze your resume and grill you on your specific skills and experience.</p>
          
          <label className="block w-full border-2 border-dashed border-indigo-200 rounded-xl p-4 text-center cursor-pointer hover:bg-indigo-50/50 transition-colors">
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
            <span className="text-indigo-600 font-semibold">Click to Upload Resume</span>
            <span className="text-gray-400 text-sm block mt-1">PDF only (Max 5MB)</span>
          </label>
        </div>

        {/* OPTION 2: TOPIC SELECTION */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 hover:shadow-2xl transition-all">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Or Choose a Track</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'Frontend (React)', icon: Code, color: 'bg-blue-100 text-blue-600' },
              { id: 'Backend (Node)', icon: Server, color: 'bg-green-100 text-green-600' },
              { id: 'System Design', icon: Database, color: 'bg-purple-100 text-purple-600' },
              { id: 'Behavioral', icon: Brain, color: 'bg-orange-100 text-orange-600' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => startTopicInterview(item.id)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group/btn"
              >
                <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mb-3 group-hover/btn:scale-110 transition-transform`}>
                  <item.icon size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-sm">{item.id}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;