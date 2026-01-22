import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      // 1. Send file to your backend
      const res = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // 2. If successful, go to Interview page and pass the Session ID
        navigate('/interview', { state: { sessionId: data.sessionId } });
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      
      <div className="text-center max-w-2xl mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <Sparkles size={16} />
          <span>AI-Powered Mock Interviews</span>
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Master Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Technical Interview</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Upload your resume and let our AI quiz you on your specific skills.
        </p>
      </div>
      
      <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-indigo-100 w-full max-w-md border border-gray-100 transition-all hover:shadow-xl relative">
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-3xl">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2" />
            <p className="text-sm font-semibold text-gray-600">Analyzing Resume...</p>
          </div>
        )}

        {/* Upload Box */}
        <label className="border-2 border-dashed border-indigo-100 bg-indigo-50/30 p-8 rounded-2xl mb-8 text-center hover:bg-indigo-50 transition-colors cursor-pointer group block">
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Click to Upload Resume (PDF)</p>
          <p className="text-xs text-gray-500 mt-1">We'll tailor questions to your skills</p>
        </label>
        
        {/* Skip Button */}
        <button 
          onClick={() => navigate('/interview')}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg group"
        >
          Skip & Start Generic Interview <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>

      </div>
    </div>
  );
};

export default Home;