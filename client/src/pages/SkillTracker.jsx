import React, { useState, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from "@monaco-editor/react";
import { 
  Zap, Plus, Trash2, Code, BookOpen, Brain, Loader2, 
  CheckCircle, XCircle, Sparkles, X, Award, BarChart3, 
  Play, Target, ShieldCheck, Search, Edit2, Link as LinkIcon, 
  ExternalLink, Lock, Star, Map as MapIcon, ArrowLeft, Trophy, Crown, Skull, 
  Terminal, Cpu, AlertTriangle, ShieldAlert, ChevronRight, Activity, Box, Layers, Server, Grid
} from 'lucide-react';

const springTransition = { type: "spring", stiffness: 300, damping: 30, mass: 1 };

// --- PORTAL ---
const GamePortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[99999] isolation-auto font-sans bg-slate-50">{children}</div>,
    document.body
  );
};

// --- LIGHT THEME "BLUEPRINT" BACKGROUND ---
const BlueprintBackground = memo(() => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#f8fafc]">
      {/* Isometric Grid Pattern */}
      <div 
        className="absolute inset-[-50%] w-[200%] h-[200%] opacity-[0.6]"
        style={{
          backgroundImage: `
            linear-gradient(#e2e8f0 1px, transparent 1px),
            linear-gradient(90deg, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
        }}
      ></div>

      {/* Floating "Blueprint" Blocks */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white border border-slate-200 shadow-sm rounded-lg opacity-60"
          style={{
            width: Math.random() * 80 + 40,
            height: Math.random() * 80 + 40,
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 90}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        >
           {/* Technical Crosshair details */}
           <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-slate-300"></div>
           <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-slate-300"></div>
        </motion.div>
      ))}
      
      {/* Vignette for focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(248,250,252,1)_90%)]"></div>
    </div>
  );
});

const SkillTracker = () => {
  const { user } = useUser();
  
  // --- STATE ---
  const [skills, setSkills] = useState([]);
  const [userXP, setUserXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // UI
  const [viewMode, setViewMode] = useState('dashboard');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSkillId, setCurrentSkillId] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Tools', level: 0, target: 'Intermediate', resources: [] });
  const [tempResource, setTempResource] = useState({ title: '', url: '' });
  const [isFetchingResources, setIsFetchingResources] = useState(false);

  // Challenge
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState(null);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // AI
  const [targetRole, setTargetRole] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const userLevel = Math.floor(userXP / 100) + 1;
  const categories = ['Frontend', 'Backend', 'Tools', 'Soft Skills', 'Languages'];
  const filterCategories = ['All', ...categories];

  // --- API ---
  const fetchData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/api/skills/${user.id}`);
      const data = await res.json();
      const safeSkills = Array.isArray(data.skills) ? data.skills : [];
      const enriched = safeSkills.map(s => ({
        ...s,
        unlockedLevel: s.unlockedLevel || Math.floor(s.level / 5) + 1,
        levelStars: s.levelStars || {}
      }));
      setSkills(enriched);
      setUserXP(data.xp || 0);
      setStreak(data.streak || 0);
    } catch (err) { console.error(err); setSkills([]); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  // --- ANTI-CHEAT ---
  useEffect(() => {
    if (viewMode !== 'arena') return;
    const handleVisibility = () => {
      if (document.hidden) setCheatWarnings(p => {
        const next = p + 1;
        if(next >= 3) setResult({ passed: false, feedback: "SESSION TERMINATED: Anti-Cheat Violation." });
        return next;
      });
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [viewMode]);

  // --- HANDLERS (FIXED: openAddModal DEFINED HERE) ---
  const openAddModal = () => { 
    setIsEditMode(false); 
    setFormData({ name: '', category: 'Tools', level: 0, target: 'Intermediate', resources: [] }); 
    setTempResource({ title: '', url: '' }); 
    setShowAddModal(true); 
  };

  const openEditModal = (skill) => { 
    setIsEditMode(true); 
    setCurrentSkillId(skill._id); 
    setFormData(skill); 
    setTempResource({ title: '', url: '' }); 
    setShowAddModal(true); 
  };

  const handleSaveSkill = async () => {
    if (!formData.name) return;
    try {
      const url = isEditMode ? `http://localhost:5000/api/skills/${currentSkillId}` : 'http://localhost:5000/api/skills';
      const method = isEditMode ? 'PUT' : 'POST';
      const payload = { ...formData, userId: user.id };
      const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
      if (res.ok) {
        const saved = await res.json();
        const normalized = { ...saved, unlockedLevel: saved.unlockedLevel || 1, levelStars: saved.levelStars || {} };
        isEditMode ? setSkills(prev => prev.map(s => s._id === currentSkillId ? normalized : s)) : setSkills(prev => [...prev, normalized]);
        setShowAddModal(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this skill?")) return;
    setSkills(prev => prev.filter(s => s._id !== id));
    await fetch(`http://localhost:5000/api/skills/${id}`, { method: 'DELETE' });
  };

  // --- GAME LOGIC ---
  const openAdventureMap = (skill) => { setSelectedSkill(skill); setViewMode('map'); };

  const enterArena = async (level) => {
    if (level > (selectedSkill?.unlockedLevel || 1)) return; 
    setSelectedLevel(level);
    setViewMode('arena');
    setResult(null);
    setUserCode('');
    setCheatWarnings(0);
    setAttempts(0);
    setActiveChallenge({ loading: true });

    try {
      const res = await fetch('http://localhost:5000/api/ai/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: selectedSkill.name, level })
      });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      setActiveChallenge({ ...data, loading: false });
      setUserCode(data.starterCode || '// Write solution here...');
    } catch (err) {
      alert("Failed to load level.");
      setViewMode('map');
    }
  };

  const exitArena = async () => {
    if (result?.passed && selectedSkill) {
       const newStars = result.stars || 1;
       const updatedSkill = { ...selectedSkill };
       const currentStars = updatedSkill.levelStars[selectedLevel] || 0;
       updatedSkill.levelStars = { ...updatedSkill.levelStars, [selectedLevel]: Math.max(currentStars, newStars) };
       
       if (selectedLevel >= updatedSkill.unlockedLevel && selectedLevel < 20) {
          updatedSkill.unlockedLevel = selectedLevel + 1;
          updatedSkill.level = Math.min(100, Math.floor((selectedLevel / 20) * 100)); 
       }
       setSkills(prev => prev.map(s => s._id === updatedSkill._id ? updatedSkill : s));
       setSelectedSkill(updatedSkill);
       await fetch(`http://localhost:5000/api/skills/${updatedSkill._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ level: updatedSkill.level, unlockedLevel: updatedSkill.unlockedLevel, levelStars: updatedSkill.levelStars })
       });
    }
    setViewMode('map');
  };

  const submitChallenge = async () => {
    if (!userCode.trim()) return;
    setGrading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/validate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            question: activeChallenge.description, 
            userAnswer: userCode,
            attempts: attempts 
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.passed) { setUserXP(prev => prev + (data.newXP || 50)); } else { setAttempts(prev => prev + 1); }
    } catch (err) { alert("Grading error."); } 
    finally { setGrading(false); }
  };

  const handleAutoSuggestResources = async () => {
    if(!formData.name) return alert("Enter Name first");
    setIsFetchingResources(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/recommend-resources', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ skill: formData.name })});
      if(res.ok) { const data = await res.json(); if(data.resources?.length) setFormData(p => ({ ...p, resources: [...p.resources, ...data.resources] })); }
    } catch(e) { console.error(e); } finally { setIsFetchingResources(false); }
  };
  const addResource = () => { if(tempResource.title) setFormData(p => ({ ...p, resources: [...p.resources, tempResource] })); setTempResource({title:'', url:''}); };
  const removeResource = (i) => { setFormData(p => ({ ...p, resources: p.resources.filter((_, idx) => idx !== i) })); };
  const handleAiAnalysis = async () => { if(!targetRole) return; setIsAnalyzing(true); try { const res = await fetch('http://localhost:5000/api/ai/skill-gap', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ currentSkills: skills.map(s=>s.name), targetRole }) }); const data = await res.json(); setAiSuggestions(data.suggestions || []); } catch(e) { console.error(e); } finally { setIsAnalyzing(false); } };

  // --- HELPERS ---
  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Frontend': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Backend': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Tools': return 'bg-violet-100 text-violet-700 border-violet-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };
  
  const getProgressColor = (level) => {
    if (level < 40) return 'bg-gradient-to-r from-rose-400 to-orange-400';
    if (level < 70) return 'bg-gradient-to-r from-amber-400 to-yellow-400';
    return 'bg-gradient-to-r from-emerald-400 to-teal-400';
  };

  const filteredSkills = skills.filter(skill => (activeCategory === 'All' || skill.category === activeCategory) && skill.name.toLowerCase().includes(search.toLowerCase()));

  const getDifficultyLabel = (lvl) => {
    if (lvl <= 5) return { label: "Novice", color: "text-emerald-600" };
    if (lvl <= 10) return { label: "Adept", color: "text-blue-600" };
    if (lvl <= 15) return { label: "Expert", color: "text-violet-600" };
    return { label: "Legend", color: "text-amber-600" };
  };

  // --- RENDERERS ---

  // 1. BLUEPRINT ADVENTURE MAP
  const RenderAdventureMap = () => {
    const totalLevels = 20;
    
    const mapPoints = useMemo(() => {
        const points = [];
        const startY = 150;
        const gapY = 200; // Increased spacing for cards
        const amplitude = 220; 
        const center = 450;
        for(let i = 0; i < totalLevels; i++) {
            const x = center + (Math.sin(i * 0.7) * amplitude); 
            const y = startY + (i * gapY);
            points.push({ x, y, level: i + 1 });
        }
        return points;
    }, []);

    const pathD = useMemo(() => {
        if(mapPoints.length === 0) return "";
        let d = `M ${mapPoints[0].x} ${mapPoints[0].y}`;
        for (let i = 0; i < mapPoints.length - 1; i++) {
            const current = mapPoints[i];
            const next = mapPoints[i+1];
            const cp1x = current.x;
            const cp1y = (current.y + next.y) / 2;
            const cp2x = next.x;
            const cp2y = (current.y + next.y) / 2;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }
        return d;
    }, [mapPoints]);

    return (
      <GamePortal>
        <div className="w-full h-full flex flex-col font-sans overflow-hidden relative text-slate-800">
          <BlueprintBackground />

          {/* Header */}
          <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-50 sticky top-0">
             <div className="flex items-center gap-6">
               <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors">
                  <ArrowLeft size={24} strokeWidth={2.5}/>
               </button>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                     {selectedSkill?.name} 
                     <span className={`text-xs font-bold px-3 py-1 rounded-md border bg-white shadow-sm ${getCategoryColor(selectedSkill?.category)}`}>
                        {selectedSkill?.category} Module
                     </span>
                  </h2>
               </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 px-5 py-2 rounded-lg border border-slate-200 shadow-sm">
                   <Star className="text-amber-400 fill-amber-400" size={18}/>
                   <span className="font-bold text-lg text-slate-700">{Object.values(selectedSkill?.levelStars || {}).reduce((a,b)=>a+b,0)} <span className="text-slate-400 text-sm font-normal">/ 60</span></span>
                </div>
             </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 overflow-y-auto relative custom-scrollbar z-10 scroll-smooth">
             <div className="relative w-full max-w-[900px] mx-auto" style={{ height: `${(totalLevels * 200) + 500}px` }}>
                
                {/* Connecting "Cable" Path */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible filter drop-shadow-sm">
                   {/* Outline */}
                   <path d={pathD} fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" />
                   {/* Main Line */}
                   <path d={pathD} fill="none" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
                   {/* Dashed Overlay */}
                   <path d={pathD} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="10 10" strokeLinecap="round" />
                </svg>

                {/* Level Cards */}
                {mapPoints.map((point, index) => {
                   const lvl = point.level;
                   const isUnlocked = lvl <= (selectedSkill?.unlockedLevel || 1);
                   const stars = selectedSkill?.levelStars?.[lvl] || 0;
                   const isBoss = lvl % 5 === 0;
                   const diff = getDifficultyLabel(lvl);

                   return (
                      <motion.div 
                        key={lvl}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{ left: point.x, top: point.y }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                         <button
                           onClick={() => isUnlocked && enterArena(lvl)}
                           disabled={!isUnlocked}
                           className={`
                             group relative transition-all duration-300 transform perspective-1000
                             ${isBoss ? 'w-64' : 'w-56'}
                             ${isUnlocked ? 'cursor-pointer hover:-translate-y-2' : 'cursor-not-allowed grayscale opacity-60'}
                           `}
                         >
                            {/* Card Body (3D Effect) */}
                            <div className={`
                               relative bg-white rounded-xl overflow-hidden transition-all duration-300
                               ${isUnlocked 
                                 ? (isBoss ? 'shadow-[0_20px_50px_-12px_rgba(225,29,72,0.3)] border-b-4 border-rose-500' : 'shadow-[0_15px_30px_-12px_rgba(0,0,0,0.1)] border-b-4 border-indigo-500 hover:shadow-2xl') 
                                 : 'shadow-none border border-slate-200 bg-slate-50'}
                            `}>
                               {/* Card Header */}
                               <div className={`h-2 w-full ${isUnlocked ? (isBoss ? 'bg-rose-500' : 'bg-indigo-500') : 'bg-slate-300'}`}></div>
                               
                               <div className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-inner
                                        ${isUnlocked 
                                          ? (isBoss ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600') 
                                          : 'bg-slate-100 text-slate-400'}
                                     `}>
                                        {isBoss ? <Skull size={20}/> : lvl}
                                     </div>
                                     <div className="text-left">
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? (isBoss ? 'text-rose-500' : 'text-slate-500') : 'text-slate-400'}`}>
                                           {isBoss ? 'Boss Raid' : `Mission ${lvl}`}
                                        </div>
                                        <div className={`text-xs font-bold ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                                           {isBoss ? 'System Core' : diff.label}
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {isUnlocked ? (
                                     <div className="flex flex-col items-end gap-1">
                                        {stars > 0 ? (
                                           <div className="flex gap-0.5">
                                              {[1,2,3].map(s => <Star key={s} size={10} className={s<=stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}/>)}
                                           </div>
                                        ) : <Lock size={14} className="text-slate-300"/>}
                                        <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 rounded">{lvl*100} XP</span>
                                     </div>
                                  ) : <Lock size={16} className="text-slate-300"/>}
                               </div>
                            </div>
                         </button>
                      </motion.div>
                   );
                })}
                
                {/* Final Goal */}
                <div className="absolute transform -translate-x-1/2 left-1/2 z-20" style={{ top: mapPoints[totalLevels-1].y + 250 }}>
                    <div className="relative group">
                       <div className="absolute inset-0 bg-amber-200 blur-[60px] opacity-40 animate-pulse"></div>
                       <div className="relative z-10 bg-white p-6 rounded-full border-4 border-amber-100 shadow-2xl">
                          <Crown size={48} className="text-amber-500 fill-amber-50" strokeWidth={1.5} />
                       </div>
                       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white px-4 py-1 rounded-full text-xs font-bold text-amber-600 shadow-lg whitespace-nowrap border border-amber-100">
                          Certified Expert
                       </div>
                    </div>
                </div>

             </div>
          </div>
        </div>
      </GamePortal>
    );
  };

  // 2. LIGHT ARENA RENDERER
  const RenderArena = () => {
    return (
      <GamePortal>
        <div className="bg-slate-50 w-full h-full flex flex-col font-sans">
           <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-50">
              <div className="flex items-center gap-4">
                 <button onClick={() => setViewMode('map')} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-bold text-xs bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200">
                    <ArrowLeft size={16}/> EXIT
                 </button>
                 <div className="h-8 w-[1px] bg-slate-200"></div>
                 <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${selectedLevel % 5 === 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                       {selectedLevel % 5 === 0 ? <Skull size={18}/> : <Code size={18}/>}
                    </div>
                    <div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Protocol</span>
                       <span className="text-sm font-bold text-slate-900 leading-none">{activeChallenge?.title || "Initializing..."}</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 {cheatWarnings > 0 && (
                   <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
                      <ShieldAlert size={14}/> ALERT {cheatWarnings}/3
                   </div>
                 )}
                 <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${attempts === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <span className="text-xs font-bold text-slate-600">Attempt {attempts + 1}</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex overflow-hidden relative">
              <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
                 <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {activeChallenge?.loading ? (
                       <div className="h-full flex flex-col items-center justify-center space-y-6">
                          <Loader2 className="animate-spin text-indigo-500" size={48}/>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Constructing Scenario...</p>
                       </div>
                    ) : (
                       <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                          <div className={`p-6 rounded-2xl border-l-4 shadow-sm bg-slate-50 ${selectedLevel % 5 === 0 ? 'border-l-rose-500' : 'border-l-indigo-500'}`}>
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                <Target size={16}/> Directive
                             </h4>
                             <p className="text-slate-700 text-sm leading-7 font-medium">{activeChallenge?.description}</p>
                          </div>
                          
                          {activeChallenge?.starterCode && (
                            <div className="space-y-3">
                               <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                 <Terminal size={14}/> Input Stream
                               </h4>
                               <div className="bg-slate-900 p-5 rounded-xl shadow-inner relative group border border-slate-800">
                                  <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{activeChallenge.starterCode}</pre>
                                  <button onClick={()=>setUserCode(activeChallenge.starterCode)} className="absolute top-3 right-3 p-1.5 bg-white/10 rounded hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all" title="Reset Code"><ArrowLeft size={14}/></button>
                               </div>
                            </div>
                          )}
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex-1 relative flex flex-col bg-white">
                 <Editor height="100%" defaultLanguage="javascript" theme="light" value={userCode} onChange={setUserCode} options={{ minimap:{enabled:false}, fontSize:15, padding:{top:32}, fontFamily: '"JetBrains Mono", monospace' }} />
                 <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-end px-8 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <button onClick={submitChallenge} disabled={grading || activeChallenge?.loading} className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-sm shadow-xl hover:-translate-y-1 transition-all ${grading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                       {grading ? <Loader2 className="animate-spin" size={18}/> : <Play size={18} fill="currentColor"/>} {grading ? 'Verifying...' : 'Run Code'}
                    </button>
                 </div>
                 <AnimatePresence>
                    {result && (
                       <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-indigo-100 p-10 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]">
                          <div className="max-w-4xl mx-auto flex items-center gap-10">
                             <div className={`p-6 rounded-3xl shadow-xl ${result.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {result.passed ? <Trophy size={48} fill="currentColor"/> : <AlertTriangle size={48}/>}
                             </div>
                             <div className="flex-1">
                                <h3 className={`text-3xl font-black mb-2 tracking-tight ${result.passed ? 'text-slate-800' : 'text-rose-600'}`}>{result.passed ? 'MISSION SUCCESS' : 'CRITICAL FAILURE'}</h3>
                                <p className="text-slate-500 text-lg leading-relaxed">{result.feedback}</p>
                             </div>
                             <div className="flex flex-col items-center gap-4">
                                {result.passed ? (
                                   <>
                                     <div className="flex gap-2">{[1,2,3].map(s => <motion.div key={s} initial={{ scale: 0, rotate: -180 }} animate={{ scale: s <= result.stars ? 1 : 0.4, rotate: 0 }} transition={{ delay: s*0.15, type: "spring" }}><Star size={36} className={s <= result.stars ? "fill-amber-400 text-amber-400 drop-shadow-md" : "text-slate-200 fill-slate-200"} /></motion.div>)}</div>
                                     <button onClick={exitArena} className="bg-indigo-600 text-white py-3 px-10 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">CONTINUE</button>
                                   </>
                                ) : (
                                   <button onClick={()=>setResult(null)} className="px-8 py-3 border-2 border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 font-bold rounded-xl transition-all">TRY AGAIN</button>
                                )}
                             </div>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </div>
      </GamePortal>
    );
  };

  if (viewMode === 'map') return <RenderAdventureMap />;
  if (viewMode === 'arena') return <RenderArena />;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans relative overflow-x-hidden">
      {/* 1. HEADER */}
      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <div className="flex flex-col xl:flex-row gap-6 mb-8 items-start xl:items-center">
          <div className="flex-1">
             <div className="flex justify-between items-end mb-4">
                <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Skill Command Center</h1><p className="text-slate-500 font-medium text-sm mt-1">Master your craft. Prove your worth.</p></div>
                <button onClick={openAddModal} className="xl:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md"><Plus size={16} /> Track New</button>
             </div>
             <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { label: 'Level', val: userLevel, icon: <Award size={16}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Total XP', val: userXP, icon: <Sparkles size={16}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Streak', val: streak, icon: <Zap size={16}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Skills', val: skills.length, icon: <BarChart3 size={16}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                  <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-white border border-slate-100 px-4 py-3 rounded-xl shadow-sm min-w-[140px]">
                     <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                     <div><div className="text-lg font-bold leading-none">{stat.val}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div></div>
                  </div>
                ))}
             </div>
          </div>
          <div className="hidden xl:block">
            <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95"><Plus size={20} /> Track New Skill</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-2">
              <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1 p-1">
                {filterCategories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{cat}</button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Find skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-full pl-9 pr-3 py-1.5 bg-slate-50 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none" />
              </div>
            </div>

            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode='popLayout'>
                {filteredSkills.map((skill, index) => (
                  <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ ...springTransition, delay: index * 0.05 }} whileHover={{ y: -5, scale: 1.02 }} key={skill._id} className="group relative bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                       <div className="flex justify-between items-start mb-3">
                          <div><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border mb-1 block w-fit ${getCategoryColor(skill.category)}`}>{skill.category}</span><h3 className="font-bold text-base text-slate-900">{skill.name}</h3></div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setIsEditMode(true); setCurrentSkillId(skill._id); setFormData(skill); setShowAddModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                              <button onClick={() => handleDelete(skill._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                           </div>
                       </div>
                       <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Level {Math.min(20, Math.floor(skill.level / 5) + 1)}</span><span className="text-slate-900">{skill.level}%</span></div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${skill.level}%` }} className={`h-full rounded-full ${getProgressColor(skill.level)}`} />
                          </div>
                       </div>
                       <div className="flex flex-wrap gap-1.5 mb-3">
                          {(skill.resources || []).slice(0,3).map((r,i) => (
                             <a key={i} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-[9px] font-semibold bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                <LinkIcon size={8}/> {r.title.slice(0,12)}
                             </a>
                          ))}
                       </div>
                    </div>
                    <div className="pt-3 border-t border-slate-50 flex justify-end">
                       <button onClick={() => openAdventureMap(skill)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-indigo-600 transition-colors shadow-sm"><MapIcon size={12} /> Play Levels</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="lg:col-span-1 space-y-4">
             <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                   <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Brain size={16}/></div>
                   <h2 className="font-bold text-sm text-slate-900">AI Analyst</h2>
                </div>
                <div className="space-y-3 relative z-10">
                   <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="Target Role..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" />
                   <button onClick={handleAiAnalysis} disabled={isAnalyzing || !targetRole} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">{isAnalyzing ? <Loader2 className="animate-spin mx-auto" size={14}/> : 'Analyze Gaps'}</button>
                   <div className="space-y-1.5">
                      {aiSuggestions.map((s, i) => (
                        <div key={i} onClick={() => { setShowAddModal(true); setFormData(prev => ({...prev, name: s.name, category: s.category || 'Tools'})); }} className="p-2 bg-slate-50 border border-slate-100 rounded text-xs flex justify-between cursor-pointer hover:bg-indigo-50">
                           <span>{s.name}</span><Plus size={12}/>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={springTransition} className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-100">
               <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-base font-bold text-slate-900">{isEditMode ? 'Edit Skill' : 'Track New Skill'}</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Skill Name</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded mb-3" placeholder="Skill Name"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Target</label>
                      <select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        {targets.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><BookOpen size={12}/> Resources</label>
                      <button type="button" onClick={handleAutoSuggestResources} disabled={isFetchingResources || !formData.name} className="flex items-center gap-1 text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors disabled:opacity-50">
                        {isFetchingResources ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Auto-Links
                      </button>
                    </div>
                    <div className="space-y-1.5 mb-2">
                      {formData.resources.map((res, idx) => (
                         <div key={idx} className="flex justify-between items-center text-xs bg-white px-2 py-1.5 rounded border border-slate-200 group">
                            <div className="flex items-center gap-2 truncate max-w-[200px]">
                              <a href={res?.url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"><ExternalLink size={10} /></a>
                              <span className="text-slate-700 font-medium truncate">{res?.title || "Unknown"}</span>
                            </div>
                            <button type="button" onClick={() => removeResource(idx)} className="text-slate-400 hover:text-rose-500"><X size={12}/></button>
                         </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input placeholder="Title" value={tempResource.title} onChange={e => setTempResource({...tempResource, title: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none" />
                      <input placeholder="URL" value={tempResource.url} onChange={e => setTempResource({...tempResource, url: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none" />
                      <button onClick={addResource} className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 rounded"><Plus size={12}/></button>
                    </div>
                  </div>
               </div>
               <div className="p-5 pt-0 flex justify-end gap-2">
                  <button onClick={() => setShowAddModal(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2">Cancel</button>
                  <button onClick={handleSaveSkill} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-indigo-100 transition-all active:scale-95">Save Changes</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillTracker;