import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award, Calendar, ArrowRight, Loader2, Star, Home } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/dashboard');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Calculate Stats
  const totalInterviews = history.length;
  const avgScore = history.length > 0 
    ? (history.reduce((acc, curr) => acc + (curr.feedback?.rating || 0), 0) / history.length).toFixed(1)
    : 0;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10 flex justify-between items-center animate-fade-in-down">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Performance</h1>
          <p className="text-gray-500 mt-2 text-lg">Track your interview progress over time.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-white text-gray-700 px-5 py-2.5 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-all flex items-center gap-2 shadow-sm"
        >
          <Home size={20} /> Back Home
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* STAT CARD 1: Total Interviews */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Calendar size={24} className="text-white" />
            </div>
            <span className="font-semibold text-indigo-100">Total Sessions</span>
          </div>
          <h2 className="text-5xl font-bold">{totalInterviews}</h2>
          <p className="text-indigo-200 mt-2 text-sm">Completed mock interviews</p>
        </div>

        {/* STAT CARD 2: Average Score */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-2xl">
              <Star size={24} className="text-amber-600" />
            </div>
            <span className="font-semibold text-gray-500">Average Score</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900">{avgScore}<span className="text-2xl text-gray-400">/10</span></h2>
          <p className="text-green-600 mt-2 text-sm font-medium flex items-center gap-1">
            <TrendingUp size={14} /> Top 15% of users
          </p>
        </div>

        {/* CARD 3: Call to Action */}
        <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between transform hover:scale-105 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/')}>
          <div>
            <div className="p-3 bg-gray-800 w-fit rounded-2xl mb-4 group-hover:bg-indigo-600 transition-colors">
              <Award size={24} />
            </div>
            <h3 className="text-2xl font-bold">Start New Session</h3>
            <p className="text-gray-400 mt-2">Practice makes perfect. Start another round now.</p>
          </div>
          <div className="flex justify-end">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center group-hover:translate-x-2 transition-transform">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>

      </div>

      {/* HISTORY LIST */}
      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp size={24} className="text-indigo-600" /> Recent History
        </h3>

        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">No interviews yet. Go start one!</p>
            </div>
          ) : (
            history.map((item, index) => (
              <div 
                key={item._id} 
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl
                    ${(item.feedback?.rating || 0) >= 8 ? 'bg-green-100 text-green-700' : 
                      (item.feedback?.rating || 0) >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`
                  }>
                    {item.feedback?.rating || '-'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {item.jsonResume?.topic || "General Interview"}
                    </h4>
                    <p className="text-gray-500 text-sm">
                      {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                    {item.feedback?.improvement && (
                      <p className="text-indigo-600 text-sm mt-1 font-medium">
                        Focus: {item.feedback.improvement}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Progress Bar Visual */}
                  <div className="hidden md:block w-32">
                    <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                      <span>Score</span>
                      <span>{item.feedback?.rating}/10</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${(item.feedback?.rating || 0) * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;