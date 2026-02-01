import React, { useState, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor, { useMonaco } from "@monaco-editor/react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
  Zap, Plus, Trash2, Code, BookOpen, Brain, Loader2, 
  CheckCircle, XCircle, Sparkles, X, Award, BarChart3, 
  Play, Target, ShieldCheck, Search, Edit2, Link as LinkIcon, 
  ExternalLink, Lock, Star, Map as MapIcon, ArrowLeft, Trophy, Crown, Skull, 
  Terminal, Cpu, AlertTriangle, ShieldAlert, ChevronRight, Activity, Box, Layers, Server, Grid, Eye, Lightbulb, Clock, ShoppingCart, Gem,
  Sun, Moon, Palette, Snowflake, Sprout, Bug, Wand, Rocket, Copy, Ruler, PieChart, Briefcase, CheckSquare, Square, ListChecks
} from 'lucide-react';

// --- CONSTANTS ---
const elegantTransition = { duration: 0.3, ease: "easeOut" };
const DECAY_DAYS_THRESHOLD = 7; 
const CATEGORIES = ['Frontend', 'Backend', 'Tools', 'Soft Skills', 'Languages'];
const TARGETS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']; 

// --- DEFAULT ROLES ---
const DEFAULT_ROLE_SETS = {
    'Full Stack': ['React', 'Node.js', 'MongoDB', 'CSS', 'JavaScript'],
    'Data Science': ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Statistics'],
    'Java Dev': ['Java', 'Spring Boot', 'SQL', 'Microservices', 'Hibernate'],
    'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD']
};

// --- INTELLIGENT CATEGORY MAPPING ---
const SKILL_CATEGORY_MAP = {
    'React': 'Frontend', 'Vue': 'Frontend', 'Angular': 'Frontend', 'CSS': 'Frontend', 'HTML': 'Frontend', 'Tailwind': 'Frontend',
    'Node.js': 'Backend', 'Express': 'Backend', 'Django': 'Backend', 'Spring Boot': 'Backend', 'MongoDB': 'Backend', 'SQL': 'Backend', 'PostgreSQL': 'Backend',
    'Python': 'Languages', 'Java': 'Languages', 'JavaScript': 'Languages', 'TypeScript': 'Languages', 'C++': 'Languages', 'Go': 'Languages', 'Rust': 'Languages',
    'Docker': 'Tools', 'Kubernetes': 'Tools', 'AWS': 'Tools', 'Git': 'Tools', 'Linux': 'Tools', 'Jenkins': 'Tools',
    'Communication': 'Soft Skills', 'Leadership': 'Soft Skills', 'Problem Solving': 'Soft Skills'
};

const autoCategorize = (skillName) => {
    if (SKILL_CATEGORY_MAP[skillName]) return SKILL_CATEGORY_MAP[skillName];
    const lowerName = skillName.toLowerCase();
    if (lowerName.includes('react') || lowerName.includes('css') || lowerName.includes('ui')) return 'Frontend';
    if (lowerName.includes('db') || lowerName.includes('sql') || lowerName.includes('server')) return 'Backend';
    if (lowerName.includes('script') || lowerName.includes('lang')) return 'Languages';
    return 'Tools'; 
};

// --- CHART COLORS ---
const ROLE_COLORS = {
    'Full Stack': '#6366f1', // Indigo
    'Data Science': '#10b981', // Emerald
    'Java Dev': '#f59e0b', // Amber
    'DevOps': '#ef4444', // Red
    'Custom': '#8b5cf6' // Violet
};

// --- ICON MAP ---
const iconMap = {
    'Sun': <Sun size={24} className="text-yellow-500" />,
    'Moon': <Moon size={24} className="text-purple-400" />,
    'Palette': <Palette size={24} className="text-pink-500" />,
    'Snowflake': <Snowflake size={24} className="text-cyan-400" />,
    'Terminal': <Terminal size={24} className="text-green-500" />,
    'Zap': <Zap size={24} className="text-yellow-400" />,
    'Sprout': <Sprout size={24} className="text-emerald-500" />,
    'Bug': <Bug size={24} className="text-red-500" />,
    'Wand': <Wand size={24} className="text-indigo-500" />,
    'Rocket': <Rocket size={24} className="text-orange-500" />,
    'Copy': <Copy size={24} className="text-blue-500" />,
    'Ruler': <Ruler size={24} className="text-slate-500" />,
    'Egg': <Sprout size={24} className="text-emerald-300" /> 
};

// --- PORTAL ---
const GamePortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[99999] isolation-auto font-sans bg-slate-50">{children}</div>,
    document.body
  );
};

// --- XP FLOATING ANIMATION ---
const XPGainAnimation = ({ amount }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100000] pointer-events-none"
        >
            <div className="text-6xl font-black text-amber-500 drop-shadow-sm flex items-center gap-2 stroke-black">
                <Sparkles size={48} className="fill-yellow-300 text-yellow-500" />
                +{amount} XP
            </div>
        </motion.div>
    );
};

// --- TERMINAL LOADER ---
const TerminalLoader = () => {
    const [lines, setLines] = useState([]);
    useEffect(() => {
        const sequence = [
            { text: "> Initializing runtime environment...", delay: 200 },
            { text: "> Compiling user script...", delay: 800 },
            { text: "> Analyzing syntax tree...", delay: 1400 },
            { text: "> Running unit tests [1/3]... PASS", delay: 2000 },
            { text: "> Running unit tests [2/3]... PASS", delay: 2500 },
            { text: "> Calculating complexity metrics...", delay: 3000 },
            { text: "> Finalizing execution...", delay: 3500 },
        ];
        let timeouts = [];
        sequence.forEach(({ text, delay }) => {
            const timeout = setTimeout(() => {
                setLines(prev => [...prev, text]);
            }, delay);
            timeouts.push(timeout);
        });
        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center font-mono"
        >
            <div className="w-[500px] bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
                <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                    <div className="w-3 h-3 rounded-full bg-red-500"/>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                    <div className="w-3 h-3 rounded-full bg-green-500"/>
                    <span className="ml-2 text-xs text-slate-400 font-medium">system_core — execution_protocol</span>
                </div>
                <div className="p-6 h-[300px] flex flex-col justify-end">
                    <div className="space-y-2">
                        {lines.map((line, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-medium text-emerald-400 font-mono">{line}</motion.div>
                        ))}
                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-emerald-500 inline-block align-middle"/>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- BLUEPRINT BACKGROUND ---
const BlueprintBackground = memo(() => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#f8fafc]">
      <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-[0.6]" style={{ backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`, backgroundSize: '40px 40px', transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)' }}></div>
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute bg-white border border-slate-200 shadow-sm rounded-lg opacity-60" style={{ width: Math.random() * 80 + 40, height: Math.random() * 80 + 40, top: `${Math.random() * 80}%`, left: `${Math.random() * 90}%` }} animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 8 + Math.random() * 5, repeat: Infinity, ease: "easeInOut", delay: i * 2 }} />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(248,250,252,1)_90%)]"></div>
    </div>
  );
});

const SkillTracker = () => {
  const { user } = useUser();
  const monaco = useMonaco();
  
  // --- STATE ---
  const [skills, setSkills] = useState([]);
  const [userXP, setUserXP] = useState(0);     
  const [userRank, setUserRank] = useState(1); 
  const [rankProgress, setRankProgress] = useState(0); 
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Shop & Inventory
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState({ theme: 'light', title: 'Novice' });
  const [shopItems, setShopItems] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [shopTab, setShopTab] = useState('theme'); 
  const [shopLoading, setShopLoading] = useState(false);

  // Graph Analytics State
  const [selectedRoleSets, setSelectedRoleSets] = useState(['Full Stack']); 
  const [activeRoles, setActiveRoles] = useState(DEFAULT_ROLE_SETS); 
  
  // Multi-Select & Modals
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [pendingSkills, setPendingSkills] = useState({ show: false, roleName: '', skills: [] });
  const [selectedPendingSkills, setSelectedPendingSkills] = useState([]);

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
  
  const [formData, setFormData] = useState({ 
      name: '', category: 'Tools', level: 0, target: 'Intermediate', resources: [], 
      prereqSkill: '', prereqLevel: 1
  });
  
  const [tempResource, setTempResource] = useState({ title: '', url: '' });
  const [isFetchingResources, setIsFetchingResources] = useState(false);

  // Challenge
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState(null);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [attempts, setAttempts] = useState(0);
  
  const [revealedHints, setRevealedHints] = useState(0);
  const [xpNotification, setXpNotification] = useState(null);

  // AI
  const [targetRole, setTargetRole] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filterCategories = ['All', ...CATEGORIES];

  // --- FILTERED SKILLS ---
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => 
        (activeCategory === 'All' || skill.category === activeCategory) && 
        skill.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [skills, activeCategory, search]);

  // --- GRAPH DATA HELPER ---
  const getGraphDataForRole = (roleName) => {
      const targetSkills = activeRoles[roleName] || [];
      return targetSkills.map(reqSkillName => {
          const userSkill = skills.find(s => s.name.toLowerCase() === reqSkillName.toLowerCase());
          return {
              subject: reqSkillName,
              A: userSkill ? (userSkill.level || 0) : 0, 
              fullMark: 100 
          };
      });
  };

  // --- THEME DEFINITIONS ---
  useEffect(() => {
      if (monaco) {
          monaco.editor.defineTheme('theme-matrix', { base: 'vs-dark', inherit: true, rules: [{ token: 'comment', foreground: '00ff00' }, { token: 'keyword', foreground: '00ff00', fontStyle: 'bold' }], colors: { 'editor.background': '#000000', 'editor.foreground': '#00cc00' } });
          monaco.editor.defineTheme('theme-cyberpunk', { base: 'vs-dark', inherit: true, rules: [{ token: 'keyword', foreground: 'ff00ff' }, { token: 'string', foreground: '00ffff' }], colors: { 'editor.background': '#0f001a', 'editor.foreground': '#e0e0e0', 'editorCursor.foreground': '#ff00ff' } });
          monaco.editor.defineTheme('theme-dracula', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#282a36', 'editor.foreground': '#f8f8f2' } });
          monaco.editor.defineTheme('theme-monokai', { base: 'vs-dark', inherit: true, rules: [{ token: 'keyword', foreground: 'F92672' }, { token: 'string', foreground: 'E6DB74' }], colors: { 'editor.background': '#272822', 'editor.foreground': '#F8F8F2' } });
          monaco.editor.defineTheme('theme-nord', { base: 'vs-dark', inherit: true, rules: [{ token: 'identifier', foreground: '88C0D0' }], colors: { 'editor.background': '#2E3440', 'editor.foreground': '#D8DEE9' } });
          
          const activeTheme = equipped.theme === 'theme-light' ? 'light' : equipped.theme;
          monaco.editor.setTheme(activeTheme);
      }
  }, [monaco, equipped.theme]);

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
      setUserRank(data.rank || 1);
      setRankProgress(data.rankProgress || 0);
      setStreak(data.streak || 0);
      setInventory(data.inventory || []);
      setEquipped(data.equipped || { theme: 'light', title: 'Novice' });
    } catch (err) { console.error(err); setSkills([]); } 
    finally { setLoading(false); }
  };

  const fetchShopItems = async () => {
      setShopLoading(true);
      try {
          const res = await fetch('http://localhost:5000/api/shop/items');
          if (res.ok) {
              const data = await res.json();
              setShopItems(data);
          }
      } catch (e) { console.error(e); }
      finally { setShopLoading(false); }
  };

  useEffect(() => { fetchData(); fetchShopItems(); }, [user]);

  useEffect(() => {
    if(xpNotification) {
        const timer = setTimeout(() => setXpNotification(null), 2000);
        return () => clearTimeout(timer);
    }
  }, [xpNotification]);

  // --- ACTIONS ---
  const handleBuy = async (item) => {
      if (userXP < item.cost) return alert("Not enough XP!");
      try {
          const res = await fetch('http://localhost:5000/api/shop/buy', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ userId: user.id, itemId: item.id })
          });
          const data = await res.json();
          if (data.success) {
              setUserXP(data.newXP);
              setInventory(data.inventory);
              alert("Purchased!");
          } else { alert(data.error); }
      } catch(e) { console.error(e); }
  };

  const handleEquip = async (item) => {
      try {
          const res = await fetch('http://localhost:5000/api/shop/equip', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ userId: user.id, itemId: item.id, type: item.type })
          });
          const data = await res.json();
          if(data.success) {
              setEquipped(data.equipped);
          }
      } catch(e) { console.error(e); }
  };

  // --- MULTI-SELECT HANDLER (WITH CONFIRMATION MODAL) ---
  const handleRoleClick = (roleName) => {
      // 1. Toggle Selection State
      setSelectedRoleSets(prev => {
          if (prev.includes(roleName)) {
              return prev.filter(r => r !== roleName);
          } else {
              return [...prev, roleName];
          }
      });

      // 2. Calculate Missing Skills
      const roleSkills = activeRoles[roleName] || [];
      const missing = roleSkills.filter(skillName => 
          !skills.find(s => s.name.toLowerCase() === skillName.toLowerCase())
      );

      // 3. If missing skills exist, open modal
      if (missing.length > 0) {
          setPendingSkills({ show: true, roleName, skills: missing });
          setSelectedPendingSkills(missing); // Default select all
      }
  };

  // --- GRAPH INTERACTION HANDLER ---
  const handleGraphClick = (data) => {
      if (data && data.activeLabel) {
          const skillName = data.activeLabel;
          const hasSkill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
          
          if (!hasSkill) {
              setPendingSkills({ show: true, roleName: 'Graph Selection', skills: [skillName] });
              setSelectedPendingSkills([skillName]);
          }
      }
  };

  // --- CONFIRM ADD SKILLS ---
  const confirmAddSkills = async () => {
      let addedCount = 0;
      for (const skillName of selectedPendingSkills) {
          try {
              const category = autoCategorize(skillName); 
              await fetch('http://localhost:5000/api/skills', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({
                      userId: user.id,
                      name: skillName,
                      category: category,
                      level: 0,
                      target: 'Intermediate',
                      resources: []
                  })
              });
              addedCount++;
          } catch (e) { console.error(e); }
      }
      
      if (addedCount > 0) await fetchData();
      setPendingSkills({ show: false, roleName: '', skills: [] });
  };

  // --- SELECTION MODE HANDLERS ---
  const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      setSelectedSkillIds([]);
  };

  const toggleCardSelection = (id) => {
      setSelectedSkillIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleDeleteSelected = async () => {
      if (!window.confirm(`Delete ${selectedSkillIds.length} skills?`)) return;
      
      for (const id of selectedSkillIds) {
          await fetch(`http://localhost:5000/api/skills/${id}`, { method: 'DELETE' });
      }
      
      setSkills(prev => prev.filter(s => !selectedSkillIds.includes(s._id)));
      setSelectedSkillIds([]);
      setIsSelectionMode(false);
  };

  // --- AI ROLE ADOPTION ---
  const handleAdoptRole = async () => {
      if (!targetRole || aiSuggestions.length === 0) return;
      const roleName = targetRole;
      const skillsToAdd = aiSuggestions.map(s => s.name || s.skill);
      
      setActiveRoles(prev => ({ ...prev, [roleName]: skillsToAdd }));
      setSelectedRoleSets(prev => [...prev, roleName]);

      const missing = skillsToAdd.filter(skillName => 
          !skills.find(s => s.name.toLowerCase() === skillName.toLowerCase())
      );

      if (missing.length > 0) {
          setPendingSkills({ show: true, roleName, skills: missing });
          setSelectedPendingSkills(missing);
      }
  };

  // --- HELPERS ---
  const checkDecay = (lastPracticedDate) => {
    if (!lastPracticedDate) return false;
    const last = new Date(lastPracticedDate);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > DECAY_DAYS_THRESHOLD;
  };
  const getDaysSince = (lastPracticedDate) => {
      if(!lastPracticedDate) return 0;
      const last = new Date(lastPracticedDate);
      const now = new Date();
      return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  };
  const getDependencyStatus = (skill) => {
    if (!skill.prerequisites || skill.prerequisites.length === 0) return { locked: false };
    const req = skill.prerequisites[0]; 
    const parentSkill = skills.find(s => s.name.toLowerCase() === req.skillName.toLowerCase());
    if (!parentSkill) return { locked: true, reason: `Requires ${req.skillName}` };
    const currentLevel = Math.floor(parentSkill.level / 5) + 1; 
    if (currentLevel < req.requiredLevel) {
        return { locked: true, reason: `Need ${req.skillName} Lv.${req.requiredLevel}` };
    }
    return { locked: false };
  };

  const openAddModal = () => { setIsEditMode(false); setFormData({ name: '', category: 'Tools', level: 0, target: 'Intermediate', resources: [], prereqSkill: '', prereqLevel: 1 }); setTempResource({ title: '', url: '' }); setShowAddModal(true); };
  const openEditModal = (skill) => { 
    setIsEditMode(true); 
    setCurrentSkillId(skill._id); 
    const existingPrereq = skill.prerequisites && skill.prerequisites.length > 0 ? skill.prerequisites[0] : null;
    setFormData({ ...skill, prereqSkill: existingPrereq ? existingPrereq.skillName : '', prereqLevel: existingPrereq ? existingPrereq.requiredLevel : 1 }); 
    setTempResource({ title: '', url: '' }); 
    setShowAddModal(true); 
  };
  const handleSaveSkill = async () => {
    if (!formData.name) return;
    try {
      const url = isEditMode ? `http://localhost:5000/api/skills/${currentSkillId}` : 'http://localhost:5000/api/skills';
      const method = isEditMode ? 'PUT' : 'POST';
      const prerequisites = formData.prereqSkill ? [{ skillName: formData.prereqSkill, requiredLevel: parseInt(formData.prereqLevel) }] : [];
      const category = autoCategorize(formData.name);
      const payload = { ...formData, userId: user.id, prerequisites, category: formData.category === 'Tools' ? category : formData.category };
      const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
      if (res.ok) { fetchData(); setShowAddModal(false); }
    } catch (err) { console.error(err); }
  };
  const handleDelete = async (id) => { if(!window.confirm("Delete this skill?")) return; setSkills(prev => prev.filter(s => s._id !== id)); await fetch(`http://localhost:5000/api/skills/${id}`, { method: 'DELETE' }); };
  const openAdventureMap = (skill) => { setSelectedSkill(skill); setViewMode('map'); };
  const enterArena = async (level) => {
    if (level > (selectedSkill?.unlockedLevel || 1)) return; 
    setSelectedLevel(level); setViewMode('arena'); setResult(null); setUserCode(''); setCheatWarnings(0); setAttempts(0); setRevealedHints(0); setActiveChallenge({ loading: true });
    try {
      const res = await fetch('http://localhost:5000/api/ai/generate-challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: selectedSkill.name, level }) });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      setActiveChallenge({ ...data, loading: false });
      setUserCode(data.starterCode || '// Write solution here...');
    } catch (err) { alert("Failed to load level."); setViewMode('map'); }
  };
  const exitArena = async () => {
    if (result?.passed && selectedSkill) {
       const newStars = result.stars || 1;
       const updatedSkill = { ...selectedSkill };
       updatedSkill.levelStars = { ...updatedSkill.levelStars, [selectedLevel]: Math.max(updatedSkill.levelStars[selectedLevel] || 0, newStars) };
       updatedSkill.lastPracticed = new Date().toISOString();
       if (selectedLevel >= updatedSkill.unlockedLevel && selectedLevel < 20) {
          updatedSkill.unlockedLevel = selectedLevel + 1;
          updatedSkill.level = Math.min(100, Math.floor((selectedLevel / 20) * 100)); 
       }
       setSkills(prev => prev.map(s => s._id === updatedSkill._id ? updatedSkill : s));
       setSelectedSkill(updatedSkill);
       await fetch(`http://localhost:5000/api/skills/${updatedSkill._id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ level: updatedSkill.level, unlockedLevel: updatedSkill.unlockedLevel, levelStars: updatedSkill.levelStars, lastPracticed: updatedSkill.lastPracticed }) });
    }
    setViewMode('map');
  };
  const submitChallenge = async () => {
    if (!userCode.trim()) return;
    setGrading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/validate-challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: activeChallenge.description, userAnswer: userCode, attempts: attempts, level: selectedLevel }) });
      const data = await res.json();
      setTimeout(async () => {
          setResult(data); setGrading(false);
          if (data.passed) { 
              const gainedXP = data.newXP || 50;
              await fetch('http://localhost:5000/api/user/add-xp', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId: user.id, amount: gainedXP }) });
              setUserXP(prev => prev + gainedXP);
              if (Math.floor((userXP + gainedXP) / 100) + 1 > userRank) setUserRank(prev => prev + 1);
              setXpNotification(gainedXP);
          } else { setAttempts(prev => prev + 1); }
      }, 4000);
    } catch (err) { alert("Grading error."); setGrading(false); } 
  };
  const handleAskOracle = async () => {
    if (!activeChallenge?.hints || revealedHints >= activeChallenge.hints.length) return;
    if (userXP < 200) return alert("Not enough XP!");
    if(window.confirm("Consult the Oracle for 200 XP?")) {
        try {
            const res = await fetch('http://localhost:5000/api/user/deduct-xp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount: 200 }) });
            const data = await res.json();
            if (data.success) { setUserXP(data.newXP); setRevealedHints(prev => prev + 1); } else { alert(data.error); }
        } catch (err) { console.error("Oracle Error:", err); }
    }
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
  const getCategoryColor = (cat) => {
    switch(cat) { case 'Frontend': return 'bg-blue-100 text-blue-700 border-blue-200'; case 'Backend': return 'bg-emerald-100 text-emerald-700 border-emerald-200'; case 'Tools': return 'bg-violet-100 text-violet-700 border-violet-200'; default: return 'bg-slate-100 text-slate-700 border-slate-200'; }
  };
  const getProgressColor = (level) => { if (level < 40) return 'bg-gradient-to-r from-rose-400 to-orange-400'; if (level < 70) return 'bg-gradient-to-r from-amber-400 to-yellow-400'; return 'bg-gradient-to-r from-emerald-400 to-teal-400'; };
  const getDifficultyLabel = (lvl) => { if (lvl <= 5) return { label: "Novice", color: "text-emerald-600" }; if (lvl <= 10) return { label: "Adept", color: "text-blue-600" }; if (lvl <= 15) return { label: "Expert", color: "text-violet-600" }; return { label: "Legend", color: "text-amber-600" }; };

  const RenderAdventureMap = () => {
    const totalLevels = 20;
    const mapPoints = useMemo(() => { const points = []; const startY = 150; const gapY = 200; const amplitude = 220; const center = 450; for(let i = 0; i < totalLevels; i++) { const x = center + (Math.sin(i * 0.7) * amplitude); const y = startY + (i * gapY); points.push({ x, y, level: i + 1 }); } return points; }, []);
    const pathD = useMemo(() => { if(mapPoints.length === 0) return ""; let d = `M ${mapPoints[0].x} ${mapPoints[0].y}`; for (let i = 0; i < mapPoints.length - 1; i++) { const current = mapPoints[i]; const next = mapPoints[i+1]; const cp1x = current.x; const cp1y = (current.y + next.y) / 2; const cp2x = next.x; const cp2y = (current.y + next.y) / 2; d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`; } return d; }, [mapPoints]);

    return (
      <GamePortal>
        <div className="w-full h-full flex flex-col font-sans overflow-hidden relative text-slate-800">
          <BlueprintBackground />
          <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-50 sticky top-0">
             <div className="flex items-center gap-6">
               <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"><ArrowLeft size={24} strokeWidth={2.5}/></button>
               <div><h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">{selectedSkill?.name} <span className={`text-xs font-bold px-3 py-1 rounded-md border bg-white shadow-sm ${getCategoryColor(selectedSkill?.category)}`}>{selectedSkill?.category} Module</span></h2></div>
             </div>
             <div className="flex items-center gap-4"><div className="flex items-center gap-2 bg-slate-50 px-5 py-2 rounded-lg border border-slate-200 shadow-sm"><Star className="text-amber-400 fill-amber-400" size={18}/><span className="font-bold text-lg text-slate-700">{Object.values(selectedSkill?.levelStars || {}).reduce((a,b)=>a+b,0)} <span className="text-slate-400 text-sm font-normal">/ 60</span></span></div></div>
          </div>
          <div className="flex-1 overflow-y-auto relative custom-scrollbar z-10 scroll-smooth">
             <div className="relative w-full max-w-[900px] mx-auto" style={{ height: `${(totalLevels * 200) + 500}px` }}>
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible filter drop-shadow-sm"><path d={pathD} fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" /><path d={pathD} fill="none" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" /><path d={pathD} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="10 10" strokeLinecap="round" /></svg>
                {mapPoints.map((point, index) => {
                   const lvl = point.level;
                   const isUnlocked = lvl <= (selectedSkill?.unlockedLevel || 1);
                   const stars = selectedSkill?.levelStars?.[lvl] || 0;
                   const isBoss = lvl % 5 === 0;
                   const diff = getDifficultyLabel(lvl);
                   return (
                      <motion.div key={lvl} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: point.x, top: point.y }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                         <button onClick={() => isUnlocked && enterArena(lvl)} disabled={!isUnlocked} className={`group relative transition-all duration-300 transform perspective-1000 ${isBoss ? 'w-64' : 'w-56'} ${isUnlocked ? 'cursor-pointer hover:-translate-y-2' : 'cursor-not-allowed grayscale opacity-60'}`}>
                            <div className={`relative bg-white rounded-xl overflow-hidden transition-all duration-300 ${isUnlocked ? (isBoss ? 'shadow-[0_20px_50px_-12px_rgba(225,29,72,0.3)] border-b-4 border-rose-500' : 'shadow-[0_15px_30px_-12px_rgba(0,0,0,0.1)] border-b-4 border-indigo-500 hover:shadow-2xl') : 'shadow-none border border-slate-200 bg-slate-50'}`}>
                               <div className={`h-2 w-full ${isUnlocked ? (isBoss ? 'bg-rose-500' : 'bg-indigo-500') : 'bg-slate-300'}`}></div>
                               <div className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-inner ${isUnlocked ? (isBoss ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600') : 'bg-slate-100 text-slate-400'}`}>{isBoss ? <Skull size={20}/> : lvl}</div>
                                     <div className="text-left"><div className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? (isBoss ? 'text-rose-500' : 'text-slate-500') : 'text-slate-400'}`}>{isBoss ? 'Boss Raid' : `Mission ${lvl}`}</div><div className={`text-xs font-bold ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>{isBoss ? 'System Core' : diff.label}</div></div>
                                  </div>
                                  {isUnlocked ? (<div className="flex flex-col items-end gap-1">{stars > 0 ? (<div className="flex gap-0.5">{[1,2,3].map(s => <Star key={s} size={10} className={s<=stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}/>)}</div>) : <Lock size={14} className="text-slate-300"/>}<span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 rounded">{lvl*100} XP</span></div>) : <Lock size={16} className="text-slate-300"/>}
                               </div>
                            </div>
                         </button>
                      </motion.div>
                   );
                })}
                <div className="absolute transform -translate-x-1/2 left-1/2 z-20" style={{ top: mapPoints[totalLevels-1].y + 250 }}><div className="relative group"><div className="absolute inset-0 bg-amber-200 blur-[60px] opacity-40 animate-pulse"></div><div className="relative z-10 bg-white p-6 rounded-full border-4 border-amber-100 shadow-2xl"><Crown size={48} className="text-amber-500 fill-amber-50" strokeWidth={1.5} /></div><div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white px-4 py-1 rounded-full text-xs font-bold text-amber-600 shadow-lg whitespace-nowrap border border-amber-100">Certified Expert</div></div></div>
             </div>
          </div>
        </div>
      </GamePortal>
    );
  };

  const RenderArena = () => {
    return (
      <GamePortal>
        <AnimatePresence>{xpNotification && <XPGainAnimation amount={xpNotification} />}</AnimatePresence>
        <AnimatePresence>{grading && <TerminalLoader />}</AnimatePresence>
        <div className="bg-slate-50 w-full h-full flex flex-col font-sans">
           <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-50">
              <div className="flex items-center gap-4">
                 <button onClick={() => setViewMode('map')} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-bold text-xs bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"><ArrowLeft size={16}/> EXIT</button>
                 <div className="h-8 w-[1px] bg-slate-200"></div>
                 <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${selectedLevel % 5 === 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{selectedLevel % 5 === 0 ? <Skull size={18}/> : <Code size={18}/>}</div>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Protocol</span><span className="text-sm font-bold text-slate-900 leading-none">{activeChallenge?.title || "Initializing..."}</span></div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 {cheatWarnings > 0 && (<div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg text-xs font-bold animate-pulse"><ShieldAlert size={14}/> ALERT {cheatWarnings}/3</div>)}
                 {activeChallenge?.hints && activeChallenge.hints.length > 0 && (<div className="flex items-center gap-2"><button onClick={handleAskOracle} disabled={revealedHints >= activeChallenge.hints.length} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${revealedHints >= activeChallenge.hints.length ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'}`}><Eye size={14} />{revealedHints >= activeChallenge.hints.length ? 'Hints Depleted' : 'Ask Oracle (200 XP)'}</button></div>)}
                 <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"><div className={`w-2 h-2 rounded-full ${attempts === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div><span className="text-xs font-bold text-slate-600">Attempt {attempts + 1}</span></div>
              </div>
           </div>
           <div className="flex-1 flex overflow-hidden relative">
              <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
                 <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {activeChallenge?.loading ? (
                       <div className="h-full flex flex-col items-center justify-center space-y-6"><Loader2 className="animate-spin text-indigo-500" size={48}/><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Constructing Scenario...</p></div>
                    ) : (
                       <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                          <div className={`p-6 rounded-2xl border-l-4 shadow-sm bg-slate-50 ${selectedLevel % 5 === 0 ? 'border-l-rose-500' : 'border-l-indigo-500'}`}><h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Target size={16}/> Directive</h4><p className="text-slate-700 text-sm leading-7 font-medium">{activeChallenge?.description}</p></div>
                          {revealedHints > 0 && activeChallenge?.hints && (<div className="space-y-3"><h4 className="text-purple-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"><Lightbulb size={14}/> Oracle's Vision</h4>{activeChallenge.hints.slice(0, revealedHints).map((hint, idx) => (<motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-xs text-purple-700 font-medium shadow-sm">{hint}</motion.div>))}</div>)}
                          {activeChallenge?.starterCode && (<div className="space-y-3"><h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"><Terminal size={14}/> Input Stream</h4><div className="bg-slate-900 p-5 rounded-xl shadow-inner relative group border border-slate-800"><pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{activeChallenge.starterCode}</pre><button onClick={()=>setUserCode(activeChallenge.starterCode)} className="absolute top-3 right-3 p-1.5 bg-white/10 rounded hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all" title="Reset Code"><ArrowLeft size={14}/></button></div></div>)}
                       </div>
                    )}
                 </div>
              </div>
              <div className="flex-1 relative flex flex-col bg-white">
                 <Editor height="100%" defaultLanguage="javascript" theme={equipped.theme === 'theme-light' ? 'light' : equipped.theme} value={userCode} onChange={setUserCode} options={{ minimap:{enabled:false}, fontSize:15, padding:{top:32}, fontFamily: '"JetBrains Mono", monospace' }} />
                 <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-end px-8 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]"><button onClick={submitChallenge} disabled={grading || activeChallenge?.loading} className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-sm shadow-xl hover:-translate-y-1 transition-all ${grading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{grading ? <Loader2 className="animate-spin" size={18}/> : <Play size={18} fill="currentColor"/>} {grading ? 'Verifying...' : 'Run Code'}</button></div>
                 <AnimatePresence>
                    {result && (
                       <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-indigo-100 p-10 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]">
                          <div className="max-w-4xl mx-auto flex items-center gap-10">
                             <div className={`p-6 rounded-3xl shadow-xl ${result.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{result.passed ? <Trophy size={48} fill="currentColor"/> : <AlertTriangle size={48}/>}</div>
                             <div className="flex-1"><h3 className={`text-3xl font-black mb-2 tracking-tight ${result.passed ? 'text-slate-800' : 'text-rose-600'}`}>{result.passed ? 'MISSION SUCCESS' : 'CRITICAL FAILURE'}</h3><p className="text-slate-500 text-lg leading-relaxed">{result.feedback}</p></div>
                             <div className="flex flex-col items-center gap-4">{result.passed ? (<><div className="flex gap-2">{[1,2,3].map(s => <motion.div key={s} initial={{ scale: 0, rotate: -180 }} animate={{ scale: s <= result.stars ? 1 : 0.4, rotate: 0 }} transition={{ delay: s*0.15, type: "spring" }}><Star size={36} className={s <= result.stars ? "fill-amber-400 text-amber-400 drop-shadow-md" : "text-slate-200 fill-slate-200"} /></motion.div>)}</div><button onClick={exitArena} className="bg-indigo-600 text-white py-3 px-10 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">CONTINUE</button></>) : (<button onClick={()=>setResult(null)} className="px-8 py-3 border-2 border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 font-bold rounded-xl transition-all">TRY AGAIN</button>)}</div>
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
      
      <AnimatePresence>
         {xpNotification && <XPGainAnimation amount={xpNotification} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <div className="flex flex-col xl:flex-row gap-6 mb-8 items-start xl:items-center">
          <div className="flex-1">
             <div className="flex justify-between items-end mb-4">
                <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Skill Command Center</h1><p className="text-slate-500 font-medium text-sm mt-1">Master your craft. Prove your worth.</p></div>
                <div className="flex gap-2">
                    <button onClick={() => setShowShop(true)} className="xl:hidden flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-bold text-sm shadow-sm transition-all"><ShoppingCart size={16}/> XP Shop</button>
                    {/* MANAGE SELECTION BUTTON */}
                    <button 
                        onClick={toggleSelectionMode} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all ${isSelectionMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <ListChecks size={16}/> {isSelectionMode ? 'Done' : 'Manage'}
                    </button>
                    {isSelectionMode && selectedSkillIds.length > 0 && (
                        <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-rose-600 transition-all animate-in fade-in slide-in-from-left-4">
                            <Trash2 size={16}/> Delete ({selectedSkillIds.length})
                        </button>
                    )}
                    <button onClick={openAddModal} className="xl:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md"><Plus size={16} /> Track New</button>
                </div>
             </div>
             <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                
                <div className="flex-shrink-0 flex items-center gap-3 bg-white border border-slate-100 px-4 py-3 rounded-xl shadow-sm min-w-[160px] relative overflow-hidden group">
                     <div className={`p-2 rounded-lg bg-indigo-50 text-indigo-600 z-10`}><Award size={16}/></div>
                     <div className="z-10">
                         <div className="text-lg font-bold leading-none">{userRank} <span className="text-xs font-normal text-slate-400">({equipped.title})</span></div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rank</div>
                     </div>
                     <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${rankProgress}%` }} 
                            transition={{ duration: 1 }}
                            className="h-full bg-indigo-500" 
                        />
                     </div>
                </div>

                {[
                  { label: 'XP Balance', val: userXP, icon: <Sparkles size={16}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
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
            <div className="flex gap-3">
                <button onClick={() => setShowShop(true)} className="flex items-center gap-2 px-6 py-3 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-bold shadow-sm transition-all"><ShoppingCart size={20}/> Shop</button>
                <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95"><Plus size={20} /> Track New Skill</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            
            {/* --- RESTORED ANALYTICS SECTION --- */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <PieChart className="text-indigo-600" size={20} />
                    <h2 className="font-bold text-slate-800">Role Mastery Graphs</h2>
                </div>
                
                {/* ROLE BUTTONS (AUTO-ADD MISSING SKILLS ON CLICK) */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {Object.keys(activeRoles).map(role => {
                        const isSelected = selectedRoleSets.includes(role);
                        return (
                            <button
                                key={role}
                                onClick={() => handleRoleClick(role)} 
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${isSelected ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                style={{ backgroundColor: isSelected ? (ROLE_COLORS[role] || ROLE_COLORS['Custom']) : undefined }}
                            >
                                {role} {isSelected && <span className="ml-1 opacity-70 text-[9px]">(Active)</span>}
                            </button>
                        );
                    })}
                </div>

                {/* GRAPH GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedRoleSets.map((roleName) => (
                        <div key={roleName} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden h-[320px]">
                            <h3 className="absolute top-5 left-5 font-bold text-slate-800 flex items-center gap-2 z-10 text-sm">
                                <Activity size={16} style={{ color: ROLE_COLORS[roleName] }}/> {roleName}
                            </h3>
                            
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="55%" outerRadius="65%" data={getGraphDataForRole(roleName)} onClick={(data) => handleGraphClick(data)}>
                                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3"/>
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name={roleName}
                                        dataKey="A"
                                        stroke={ROLE_COLORS[roleName] || ROLE_COLORS['Custom']}
                                        strokeWidth={2}
                                        fill={ROLE_COLORS[roleName] || ROLE_COLORS['Custom']}
                                        fillOpacity={0.2}
                                        isAnimationActive={true}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '11px', padding: '8px' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-2">
              <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1 p-1">
                {filterCategories.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{cat}</button>))}
              </div>
              <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder="Find skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-full pl-9 pr-3 py-1.5 bg-slate-50 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode='popLayout'>
                {filteredSkills.map((skill, index) => {
                    const isDecaying = checkDecay(skill.lastPracticed);
                    const daysSince = getDaysSince(skill.lastPracticed);
                    const depStatus = getDependencyStatus(skill);
                    const progress = skill.level || 0;
                    const isSelected = selectedSkillIds.includes(skill._id);

                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, scale: isSelectionMode && isSelected ? 0.95 : 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ ...elegantTransition, delay: index * 0.05 }}
                            whileHover={{ y: depStatus.locked || isSelectionMode ? 0 : -5 }} 
                            key={skill._id} 
                            onClick={() => isSelectionMode && toggleCardSelection(skill._id)}
                            className={`group relative bg-white border p-5 rounded-2xl shadow-sm transition-all cursor-pointer
                                ${isDecaying ? 'border-orange-200 bg-orange-50/20' : 'border-slate-100'}
                                ${depStatus.locked ? 'opacity-70 bg-slate-50 border-slate-200 grayscale' : isSelectionMode ? (isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'hover:border-slate-300') : 'hover:border-indigo-100 hover:shadow-lg'}
                            `}
                        >
                            {/* SELECTION OVERLAY */}
                            {isSelectionMode && (
                                <div className="absolute top-4 right-4 z-20">
                                    {isSelected ? <CheckSquare className="text-indigo-600" size={24}/> : <Square className="text-slate-300" size={24}/>}
                                </div>
                            )}

                            {isDecaying && !depStatus.locked && !isSelectionMode && (
                                <div className="absolute top-4 right-4">
                                    <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[9px] font-bold border border-orange-200/50 shadow-sm" title={`Last practiced ${daysSince} days ago`}>
                                        <Clock size={10} strokeWidth={3} /> Needs Practice
                                    </div>
                                </div>
                            )}
                            
                            {depStatus.locked && !isSelectionMode && (
                                <div className="absolute top-4 right-4">
                                    <div className="flex items-center gap-1.5 bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full text-[9px] font-bold border border-slate-300/50 shadow-sm">
                                        <Lock size={10} strokeWidth={3} /> Locked
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex flex-col items-start mb-4">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-sm mb-2 tracking-wide uppercase ${getCategoryColor(skill.category)}`}>
                                        {skill.category}
                                    </span>
                                    <div className="flex justify-between w-full items-start">
                                        <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{skill.name}</h3>
                                        
                                        {/* EDIT / DELETE BUTTONS (Visible only when NOT selecting) */}
                                        {!isSelectionMode && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(skill); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(skill._id); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                        <span>Rank {Math.min(20, Math.floor(skill.level / 5) + 1)}</span>
                                        <span className={progress >= 100 ? 'text-emerald-600' : 'text-slate-900'}>{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${progress}%` }} 
                                            className={`h-full rounded-full shadow-sm ${getProgressColor(progress)}`} 
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
                                    {(skill.resources || []).slice(0,2).map((r,i) => (
                                        <a key={i} href={r.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] font-semibold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors">
                                            <LinkIcon size={10}/> {r.title.slice(0,10)}...
                                        </a>
                                    ))}
                                </div>
                                
                                {depStatus.locked && (
                                    <div className="mt-2 text-[10px] text-rose-500 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100 flex items-center gap-1.5">
                                        <Lock size={12} /> {depStatus.reason}
                                    </div>
                                )}
                            </div>
                            
                            <div className="pt-4 border-t border-slate-50 flex justify-end">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); !depStatus.locked && !isSelectionMode && openAdventureMap(skill); }} 
                                    disabled={depStatus.locked || isSelectionMode}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 
                                    ${depStatus.locked || isSelectionMode
                                        ? 'bg-slate-100 cursor-not-allowed text-slate-400 shadow-none border border-slate-200' 
                                        : isDecaying 
                                            ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:shadow-orange-300' 
                                            : 'bg-slate-900 hover:bg-indigo-600 shadow-slate-200 hover:shadow-indigo-200'}`}
                                >
                                    <MapIcon size={14} /> {depStatus.locked ? 'Locked' : (isDecaying ? 'Polish Skill' : 'Play Levels')}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
             <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-16 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity"/>
                <div className="flex items-center gap-3 mb-5 relative z-10">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 shadow-sm"><Brain size={20}/></div>
                    <div>
                        <h2 className="font-extrabold text-base text-slate-900">AI Career Analyst</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Powered by Groq</p>
                    </div>
                </div>
                <div className="space-y-3 relative z-10">
                   <input 
                        value={targetRole} 
                        onChange={e => setTargetRole(e.target.value)} 
                        placeholder="E.g. Full Stack Developer..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all placeholder:text-slate-400" 
                    />
                   <button 
                        onClick={handleAiAnalysis} 
                        disabled={isAnalyzing || !targetRole} 
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} {isAnalyzing ? 'Analyzing...' : 'Identify Gaps'}
                    </button>
                   
                   {/* NEW: ADOPT ROLE BUTTON */}
                   {aiSuggestions.length > 0 && (
                       <motion.button 
                            initial={{ opacity: 0, y: 5 }} 
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleAdoptRole}
                            className="w-full mt-2 bg-emerald-50 text-emerald-600 border border-emerald-100 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                       >
                           <Target size={14}/> Track this Role
                       </motion.button>
                   )}

                   <div className="space-y-2 mt-4">
                      {aiSuggestions.map((s, i) => (
                        <div 
                            key={i} 
                            onClick={() => { 
                                setIsEditMode(false); 
                                setShowAddModal(true); 
                                setFormData({ 
                                    name: s.name || s.skill || s.title || "", 
                                    category: s.category || 'Tools', 
                                    level: 0, 
                                    target: 'Intermediate', 
                                    resources: [], 
                                    prereqSkill: '', 
                                    prereqLevel: 1 
                                }); 
                                setTempResource({ title: '', url: '' }); 
                            }} 
                            className="p-3 bg-white border border-slate-100 rounded-xl text-xs font-medium flex justify-between items-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group/item"
                        >
                           <span className="text-slate-600 group-hover/item:text-indigo-700 transition-colors">{s.name || s.skill || "New Skill"}</span>
                           <div className="bg-slate-100 text-slate-400 p-1 rounded-lg group-hover/item:bg-indigo-100 group-hover/item:text-indigo-600 transition-colors">
                                <Plus size={12}/>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* MISSING SKILLS CONFIRMATION MODAL */}
      <AnimatePresence>
        {pendingSkills.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-slate-100">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-900">Add Missing Skills?</h2>
                        <button onClick={() => setPendingSkills({ show: false, roleName: '', skills: [] })}><X size={16} className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-slate-500 mb-4">To complete the <strong>{pendingSkills.roleName}</strong> path, we recommend tracking these skills:</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {pendingSkills.skills.map(skill => (
                                <div key={skill} 
                                     className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                                     onClick={() => {
                                         if (selectedPendingSkills.includes(skill)) {
                                             setSelectedPendingSkills(prev => prev.filter(s => s !== skill));
                                         } else {
                                             setSelectedPendingSkills(prev => [...prev, skill]);
                                         }
                                     }}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedPendingSkills.includes(skill) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                        {selectedPendingSkills.includes(skill) && <CheckCircle size={12} className="text-white"/>}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{skill}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-5 pt-0 flex gap-2">
                        <button onClick={() => setPendingSkills({ show: false, roleName: '', skills: [] })} className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button onClick={confirmAddSkills} className="flex-1 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-md disabled:opacity-50" disabled={selectedPendingSkills.length === 0}>
                            Add {selectedPendingSkills.length} Skills
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={elegantTransition} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
               <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{isEditMode ? 'Edit Skill' : 'Track New Skill'}</h2>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"><X size={18}/></button>
               </div>
               <div className="p-6 space-y-5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Skill Name</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="e.g. React, Python..."/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Target</label>
                        <select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white">
                            {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                  </div>

                  {/* PREREQUISITE SECTION */}
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/60">
                    <label className="text-[10px] font-bold text-amber-700 uppercase mb-2 block flex items-center gap-1.5 tracking-wide"><Lock size={12} /> Prerequisite (Optional)</label>
                    <div className="flex gap-3">
                        <select 
                            className="flex-1 border border-amber-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-amber-400"
                            value={formData.prereqSkill}
                            onChange={e => setFormData({...formData, prereqSkill: e.target.value})}
                        >
                            <option value="">None</option>
                            {skills.filter(s => s.name !== formData.name).map(s => (
                                <option key={s._id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        <select
                            className="w-24 border border-amber-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-amber-400"
                            value={formData.prereqLevel}
                            onChange={e => setFormData({...formData, prereqLevel: e.target.value})}
                            disabled={!formData.prereqSkill}
                        >
                            {[1,5,10,15,20].map(l => <option key={l} value={l}>Lvl {l}</option>)}
                        </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><BookOpen size={12}/> Resources</label>
                      <button type="button" onClick={handleAutoSuggestResources} disabled={isFetchingResources || !formData.name} className="flex items-center gap-1.5 text-[10px] font-bold bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all disabled:opacity-50">
                        {isFetchingResources ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Auto-Links
                      </button>
                    </div>
                    <div className="space-y-2 mb-3">
                      {formData.resources.map((res, idx) => (
                         <div key={idx} className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 group shadow-sm">
                            <div className="flex items-center gap-2 truncate max-w-[200px]">
                              <a href={res?.url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"><ExternalLink size={12} /></a>
                              <span className="text-slate-700 font-medium truncate">{res?.title || "Unknown"}</span>
                            </div>
                            <button type="button" onClick={() => removeResource(idx)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={14}/></button>
                         </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input placeholder="Title" value={tempResource.title} onChange={e => setTempResource({...tempResource, title: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400" />
                      <input placeholder="URL" value={tempResource.url} onChange={e => setTempResource({...tempResource, url: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400" />
                      <button onClick={addResource} className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 rounded-lg transition-colors"><Plus size={14}/></button>
                    </div>
                  </div>
               </div>
               <div className="p-6 pt-0 flex justify-end gap-3">
                  <button onClick={() => setShowAddModal(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleSaveSkill} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95">Save Changes</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHOP MODAL */}
      <AnimatePresence>
        {showShop && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2"><ShoppingCart className="text-indigo-600" /><h2 className="text-lg font-bold text-slate-900">XP Shop</h2></div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold text-xs"><Sparkles size={12}/> {userXP} XP</div>
                            <button onClick={() => setShowShop(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                    </div>
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setShopTab('theme')} className={`flex-1 py-3 text-sm font-bold transition-colors ${shopTab === 'theme' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>Themes</button>
                        <button onClick={() => setShopTab('title')} className={`flex-1 py-3 text-sm font-bold transition-colors ${shopTab === 'title' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>Titles</button>
                    </div>
                    <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50">
                        {shopLoading && <div className="col-span-2 text-center py-8 text-slate-500 flex justify-center"><Loader2 className="animate-spin"/></div>}
                        {!shopLoading && shopItems.filter(i => i.type === shopTab).map(item => {
                            const isOwned = inventory.includes(item.id);
                            // --- FIX: Handle both 'light' and 'theme-light' as equivalent ---
                            const isActiveTheme = shopTab === 'theme' && (equipped.theme === item.id || (equipped.theme === 'light' && item.id === 'theme-light'));
                            const isActiveTitle = shopTab === 'title' && equipped.title === item.name;
                            const isEquipped = isActiveTheme || isActiveTitle;
                            
                            // Get Icon Component
                            const IconComponent = iconMap[item.icon] || <Sparkles size={24} className="text-slate-400"/>;

                            return (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg self-start">
                                        {IconComponent}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                                            {isEquipped && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={8}/> Active</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3 leading-snug">{item.description}</p>
                                        <div className="flex justify-between items-center mt-auto">
                                            <div className="text-xs font-bold text-slate-400">{item.cost === 0 ? 'Free' : `${item.cost} XP`}</div>
                                            {isOwned ? (
                                                <button 
                                                    onClick={() => handleEquip(item)}
                                                    disabled={isEquipped}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEquipped ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                                >
                                                    {isEquipped ? 'Equipped' : 'Equip'}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleBuy(item)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1 transition-all"
                                                >
                                                    <Gem size={12}/> Buy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SkillTracker;