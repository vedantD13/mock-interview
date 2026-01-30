import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from "@monaco-editor/react"; // <--- IMPORT MONACO EDITOR
import { 
  Zap, Plus, Trash2, TrendingUp, Code, Server, Wrench, 
  BookOpen, Brain, Loader2, CheckCircle, XCircle, 
  Sparkles, X, Award, BarChart3, ChevronRight, Play, Target, ShieldCheck
} from 'lucide-react';

const SkillTracker = () => {
  const { user } = useUser();
  const [skills, setSkills] = useState([]);
  const [userXP, setUserXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Challenge State
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Tools', level: 0, target: 'Intermediate' });

  // AI Analysis State
  const [targetRole, setTargetRole] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Stats
  const userLevel = Math.floor(userXP / 100) + 1;
  const categories = ['Frontend', 'Backend', 'Tools', 'Soft Skills', 'Languages'];
  const targets = ['Beginner', 'Intermediate', 'Expert'];

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  // --- API CALLS ---
  const fetchData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/api/skills/${user.id}`);
      const data = await res.json();
      setSkills(data.skills || []);
      setUserXP(data.xp || 0);
      setStreak(data.streak || 0);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const startChallenge = async (skill) => {
    setResult(null);
    setUserCode('');
    setActiveChallenge({ loading: true });
    
    try {
      const res = await fetch('http://localhost:5000/api/ai/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skill.name, level: skill.level })
      });
      const question = await res.json();
      setActiveChallenge({ skillId: skill._id, skillName: skill.name, ...question });
      setUserCode(question.starterCode || '// Write your solution here...');
    } catch (err) {
      alert("Failed to generate challenge.");
      setActiveChallenge(null);
    }
  };

  const submitChallenge = async () => {
    if (!userCode.trim()) return;
    setGrading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/validate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          skillId: activeChallenge.skillId,
          question: activeChallenge.description,
          userAnswer: userCode
        })
      });
      const grade = await res.json();
      setResult(grade);
      
      if (grade.passed) {
        setSkills(prev => prev.map(s => 
          s._id === activeChallenge.skillId ? { ...s, level: s.level + 5 } : s
        ));
        setUserXP(grade.newXP);
        if (grade.newStreak) setStreak(grade.newStreak);
      }
    } catch (err) {
      alert("Grading failed.");
    } finally {
      setGrading(false);
    }
  };

  const handleDelete = async (id) => {
    setSkills(prev => prev.filter(s => s._id !== id));
    await fetch(`http://localhost:5000/api/skills/${id}`, { method: 'DELETE' });
  };

  const addSkill = async () => {
    if (!newSkill.name) return;
    try {
      const skillPayload = { userId: user.id, ...newSkill, level: 0 };
      const res = await fetch('http://localhost:5000/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillPayload)
      });
      
      if (res.ok) {
        const savedSkill = await res.json();
        setSkills(prev => [...prev, savedSkill]);
        setShowAddModal(false);
        setNewSkill({ name: '', category: 'Tools', level: 0, target: 'Intermediate' });
      }
    } catch (err) { console.error(err); }
  };

  const handleAiAnalysis = async () => {
    if (!targetRole) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSkills: skills.map(s => s.name), targetRole })
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
    } catch (err) { console.error(err); } 
    finally { setIsAnalyzing(false); }
  };

  // --- STYLING HELPERS ---
  const getCategoryStyles = (cat) => {
    switch(cat) {
      case 'Frontend': return { badge: 'bg-blue-100 text-blue-700', icon: <Code size={18} className="text-blue-600"/>, bar: 'bg-blue-600' };
      case 'Backend': return { badge: 'bg-emerald-100 text-emerald-700', icon: <Server size={18} className="text-emerald-600"/>, bar: 'bg-emerald-600' };
      case 'Tools': return { badge: 'bg-indigo-100 text-indigo-700', icon: <Wrench size={18} className="text-indigo-600"/>, bar: 'bg-indigo-600' };
      case 'Soft Skills': return { badge: 'bg-orange-100 text-orange-700', icon: <Brain size={18} className="text-orange-600"/>, bar: 'bg-orange-600' };
      default: return { badge: 'bg-gray-100 text-gray-700', icon: <Zap size={18} className="text-gray-600"/>, bar: 'bg-gray-600' };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 relative">
      
      {/* 1. HEADER DASHBOARD */}
      <div className="max-w-7xl mx-auto mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Skill Command Center
            </h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">Verify your expertise through AI challenges.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="flex items-center gap-2 bg-[#6366f1] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-200 active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} /> Track New Skill
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Current Level', val: userLevel, sub: 'Senior Dev', icon: <Award size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total XP', val: userXP, sub: 'Points Earned', icon: <TrendingUp size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Daily Streak', val: streak, sub: 'Days Active', icon: <Zap size={20}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Total Skills', val: skills.length, sub: 'Tracked', icon: <BarChart3 size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"
            >
               <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
               </div>
               <div className="text-3xl font-bold text-gray-900">{stat.val}</div>
               <div className="text-xs font-medium text-gray-400 mt-1">{stat.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. SKILL LIST (Your Arsenal) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Your Arsenal</h2>
             <span className="text-xs font-medium text-gray-400">{skills.length} skills tracked</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {skills.map(skill => {
              const style = getCategoryStyles(skill.category);
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={skill._id} 
                  className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all relative overflow-hidden"
                >
                   {/* Top Row */}
                   <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            {style.icon}
                         </div>
                         <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-none mb-1.5">{skill.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${style.badge}`}>
                               {skill.category}
                            </span>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(skill._id)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>

                   {/* Progress Section */}
                   <div className="space-y-2 mb-5">
                      <div className="flex justify-between text-xs font-bold text-gray-500">
                         <span>Proficiency</span>
                         <span className="text-gray-900">{skill.level}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.level}%` }}
                            className={`h-full rounded-full ${style.bar}`}
                         />
                      </div>
                   </div>

                   {/* Footer Action */}
                   <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                         <Target size={14} className="text-gray-400"/>
                         <span className="text-xs font-bold text-gray-500">{skill.target}</span>
                      </div>
                      <button 
                        onClick={() => startChallenge(skill)}
                        className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-900 hover:text-white transition-all`}
                      >
                        <ShieldCheck size={14} /> Prove It
                      </button>
                   </div>
                </motion.div>
              );
            })}

            {skills.length === 0 && !loading && (
              <div className="col-span-2 py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300"><Target size={24}/></div>
                 <p className="text-gray-400 text-sm font-medium">No skills tracked yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. AI ANALYST SIDEBAR */}
        <div className="space-y-6">
           <div className="bg-[#1e293b] rounded-2xl p-6 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                    <Sparkles size={18} className="text-indigo-400"/>
                 </div>
                 <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Skill Gap Analysis</h2>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="relative">
                  <input 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Target Role (e.g. Senior Dev)"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-500 transition-all"
                  />
                  <button 
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing || !targetRole}
                    className="absolute right-1.5 top-1.5 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? <Loader2 size={14} className="animate-spin"/> : <ChevronRight size={14}/>}
                  </button>
                </div>

                <div className="space-y-2 mt-4">
                   {aiSuggestions.map((sugg, i) => (
                     <div 
                       key={i} 
                       className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group"
                       onClick={() => {
                          setNewSkill({ name: sugg.name, category: sugg.category || 'Tools', level: 0, target: 'Beginner' });
                          setShowAddModal(true);
                       }}
                     >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-300 group-hover:text-white">{sugg.name}</span>
                          <Plus size={14} className="text-slate-500 group-hover:text-indigo-400" />
                        </div>
                     </div>
                   ))}
                   {aiSuggestions.length === 0 && !isAnalyzing && (
                      <div className="text-center py-8 opacity-30 text-xs">Analyze a role to see gaps.</div>
                   )}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 4. MODAL: TRACK NEW SKILL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
               className="bg-white rounded-[20px] w-full max-w-lg shadow-2xl relative overflow-hidden"
             >
                <div className="p-8 pb-0">
                   <h2 className="text-2xl font-bold text-gray-900 mb-1">Track New Skill</h2>
                </div>
                
                <div className="p-8 space-y-6">
                   {/* Skill Name */}
                   <div>
                     <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Skill Name</label>
                     <input 
                       value={newSkill.name} 
                       onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} 
                       className="w-full border-2 border-indigo-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:border-[#6366f1] focus:ring-0 outline-none transition-colors placeholder-gray-300"
                       placeholder="e.g. Docker, Figma, Public Speaking"
                       autoFocus
                     />
                   </div>
                   
                   {/* Category Pills */}
                   <div>
                     <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                     <div className="flex flex-wrap gap-2">
                       {categories.map(cat => (
                         <button 
                           key={cat}
                           onClick={() => setNewSkill({...newSkill, category: cat})}
                           className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${newSkill.category === cat ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                         >
                           {cat}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Target Proficiency */}
                   <div>
                     <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Target Proficiency</label>
                     <div className="flex bg-gray-50 p-1.5 rounded-xl">
                       {targets.map(t => (
                         <button
                           key={t}
                           onClick={() => setNewSkill({...newSkill, target: t})}
                           className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${newSkill.target === t ? 'bg-white text-[#6366f1] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                           {t}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* LOCKED Level Display */}
                   <div>
                     <div className="flex justify-between mb-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Current Level: 0%</label>
                     </div>
                     <div className="w-full h-2 bg-gray-200 rounded-lg relative overflow-hidden opacity-50 cursor-not-allowed">
                        <div className="absolute top-0 left-0 h-full w-0 bg-indigo-500"></div>
                     </div>
                     <p className="text-[10px] text-gray-400 mt-2">Proficiency starts at 0%. Complete challenges to level up.</p>
                   </div>
                </div>

                <div className="p-8 pt-0 flex justify-end gap-4">
                   <button onClick={() => setShowAddModal(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                   <button 
                     onClick={addSkill} 
                     className="px-8 py-3 text-sm font-bold bg-[#6366f1] text-white rounded-xl hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform active:scale-95"
                   >
                     Save Skill
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. CHALLENGE MODAL (Monaco Editor Integration) */}
      <AnimatePresence>
        {activeChallenge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#1e1e1e] w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
                <div className="bg-[#252526] px-6 py-4 flex justify-between items-center border-b border-white/10">
                   <div className="flex items-center gap-3">
                      <Code className="text-indigo-400" size={20} />
                      <h3 className="text-gray-200 font-bold tracking-tight">Challenge: {activeChallenge.skillName}</h3>
                   </div>
                   <button onClick={() => setActiveChallenge(null)} className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"><X size={20}/></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                   <div className="w-1/3 bg-[#1e1e1e] p-8 border-r border-white/10 overflow-y-auto">
                      {activeChallenge.loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-6">
                           <Loader2 className="animate-spin text-indigo-500" size={32}/>
                           <p className="text-sm font-medium animate-pulse">Generating scenario...</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div>
                             <h2 className="text-xl font-bold text-white mb-4 leading-tight">{activeChallenge.title}</h2>
                             <div className="h-1 w-12 bg-indigo-500 rounded-full mb-6"></div>
                             <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{activeChallenge.description}</p>
                          </div>
                          
                          <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                             <div className="flex items-center gap-2 mb-2">
                                <Target size={16} className="text-indigo-400"/>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Objective</p>
                             </div>
                             <p className="text-white font-medium text-sm">Submit a valid solution to prove your competency and earn XP.</p>
                          </div>
                        </div>
                      )}
                   </div>

                   {/* Right: Monaco Editor */}
                   <div className="w-2/3 bg-[#1e1e1e] flex flex-col relative">
                      <div className="flex-1">
                        <Editor
                          height="100%"
                          defaultLanguage="javascript"
                          theme="vs-dark"
                          value={userCode}
                          onChange={(value) => setUserCode(value)}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20, bottom: 20 }
                          }}
                        />
                      </div>
                      
                      {result && (
                         <div className={`absolute bottom-[80px] inset-x-6 p-4 rounded-xl border backdrop-blur-xl shadow-2xl z-10 ${result.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-start gap-4">
                               <div className={`p-2 rounded-full ${result.passed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                  {result.passed ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                               </div>
                               <div>
                                  <h4 className={`font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                     {result.passed ? 'Challenge Passed!' : 'Needs Improvement'}
                                  </h4>
                                  <p className="text-sm text-slate-300 mt-1">{result.feedback}</p>
                               </div>
                            </div>
                         </div>
                      )}

                      <div className="p-6 border-t border-slate-800 bg-[#1e293b] flex justify-between items-center relative z-20">
                         <span className="text-xs text-slate-500">AI-Powered Assessment</span>
                         <motion.button 
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={submitChallenge} 
                           disabled={grading || activeChallenge.loading}
                           className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${grading ? 'bg-slate-700 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}`}
                         >
                           {grading ? <Loader2 className="animate-spin" size={18}/> : <Play size={18} fill="currentColor"/>}
                           {grading ? 'Verifying Solution...' : 'Submit Answer'}
                         </motion.button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SkillTracker;