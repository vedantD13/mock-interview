import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Download, Sparkles, Plus, Save, Loader2 } from 'lucide-react';

const ResumeBuilder = () => {
  const { user } = useUser();
  const [resume, setResume] = useState({
    personal: { name: "", email: "", phone: "", summary: "" },
    experience: [],
    skills: []
  });
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // 1. Fetch Resume on Mount
  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5000/api/resume/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data) setResume(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  // 2. Save Function
  const handleSave = async () => {
    await fetch('http://localhost:5000/api/resume/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...resume })
    });
    alert("Resume Saved!");
  };

  // 3. AI Optimize Function
  const handleAiOptimize = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/resume/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentResume: resume })
      });
      const data = await res.json();
      setResume(prev => ({
        ...prev,
        personal: { ...prev.personal, summary: data.optimizedSummary }
      }));
    } catch (err) {
      console.error(err);
      alert("AI Generation failed");
    }
    setAiLoading(false);
  };

  // Helper to update state
  const updatePersonal = (field, value) => {
    setResume(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  };

  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now(), role: "New Role", company: "Company", duration: "2024", desc: "" }]
    }));
  };

  const updateExperience = (index, field, value) => {
    const newExp = [...resume.experience];
    newExp[index][field] = value;
    setResume(prev => ({ ...prev, experience: newExp }));
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 pt-24 flex gap-8">
      {/* Editor Section */}
      <div className="w-1/2 space-y-6 overflow-y-auto h-[85vh] pr-4 no-scrollbar">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            <p className="text-slate-400">AI-Powered Resume Editor</p>
          </div>
          <button onClick={handleSave} className="bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
            <Save size={18} /> Save
          </button>
        </header>

        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Personal Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input className="bg-slate-800 p-3 rounded-lg border border-slate-700" placeholder="Full Name" value={resume.personal.name || ''} onChange={e => updatePersonal('name', e.target.value)} />
            <input className="bg-slate-800 p-3 rounded-lg border border-slate-700" placeholder="Email" value={resume.personal.email || ''} onChange={e => updatePersonal('email', e.target.value)} />
            <input className="bg-slate-800 p-3 rounded-lg border border-slate-700" placeholder="Phone" value={resume.personal.phone || ''} onChange={e => updatePersonal('phone', e.target.value)} />
          </div>
          <div className="relative">
            <textarea className="bg-slate-800 p-3 rounded-lg border border-slate-700 w-full h-32" placeholder="Summary" value={resume.personal.summary || ''} onChange={e => updatePersonal('summary', e.target.value)} />
            <button onClick={handleAiOptimize} className="absolute bottom-4 right-4 text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm bg-slate-900/80 px-2 py-1 rounded border border-purple-500/30">
              {aiLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} AI Enhance
            </button>
          </div>
        </section>

        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-semibold text-blue-400">Experience</h2>
             <button onClick={addExperience} className="text-sm bg-slate-800 px-3 py-1 rounded hover:bg-slate-700 flex items-center gap-1"><Plus size={14} /> Add</button>
          </div>
          {resume.experience.map((exp, i) => (
            <div key={exp.id} className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2">
              <input value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} className="bg-transparent font-bold w-full outline-none" placeholder="Job Role" />
              <div className="flex gap-2">
                <input value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} className="bg-transparent text-sm text-slate-400 w-1/2 outline-none" placeholder="Company" />
                <input value={exp.duration} onChange={e => updateExperience(i, 'duration', e.target.value)} className="bg-transparent text-sm text-slate-400 w-1/2 outline-none text-right" placeholder="Duration" />
              </div>
              <textarea value={exp.desc} onChange={e => updateExperience(i, 'desc', e.target.value)} className="bg-slate-800 w-full p-2 rounded text-sm text-slate-300 h-20" placeholder="Description" />
            </div>
          ))}
        </section>
      </div>

      {/* Preview Section */}
      <div className="w-1/2 bg-white text-slate-900 p-8 rounded shadow-2xl h-[85vh] overflow-y-auto">
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
          <h1 className="text-4xl font-bold uppercase">{resume.personal.name || "Your Name"}</h1>
          <p className="text-sm text-slate-600">{resume.personal.email} | {resume.personal.phone}</p>
        </div>
        <div className="mb-6">
          <h3 className="font-bold border-b border-slate-300 uppercase mb-2">Profile</h3>
          <p className="text-sm">{resume.personal.summary}</p>
        </div>
        <div>
          <h3 className="font-bold border-b border-slate-300 uppercase mb-2">Experience</h3>
          {resume.experience.map(exp => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between font-bold text-sm">
                <span>{exp.role}</span>
                <span>{exp.duration}</span>
              </div>
              <div className="text-sm italic mb-1">{exp.company}</div>
              <p className="text-sm">{exp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;