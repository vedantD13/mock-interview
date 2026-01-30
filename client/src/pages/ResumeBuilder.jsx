import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { 
  User, Briefcase, GraduationCap, Code, FileText, 
  Sparkles, Plus, Trash2, Printer, LayoutTemplate, 
  Mail, Phone, MapPin, Linkedin, Github, Palette, 
  Type, Loader2, Wand2, RefreshCcw, CheckCircle, Cloud,
  ZoomIn, ZoomOut, X, Edit3, Grid, AlignLeft, MousePointer2,
  Maximize, Upload, GripVertical, Image as ImageIcon
} from 'lucide-react';

// --- UTILS ---
const hexToRgba = (hex, alpha = 1) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- ANIMATION VARIANTS ---
const drawerVariants = {
  hidden: { x: -450, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
};

const designPanelVariants = {
  hidden: { x: 400, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

// --- COMPONENTS ---

const InputGroup = ({ label, value, onChange, placeholder, type = "text", multiline = false }) => (
  <div className="mb-5 group">
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-600 transition-colors">{label}</label>
    {multiline ? (
      <textarea
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-sm shadow-sm hover:bg-white focus:bg-white"
      />
    ) : (
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm hover:bg-white focus:bg-white"
      />
    )}
  </div>
);

// --- MAIN PAGE ---

const ResumeBuilder = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const printRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.75);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // --- DATA STATE ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); 

  // --- DESIGN STATE ---
  const [design, setDesign] = useState({
    accentColor: '#4f46e5',
    template: 'modern', 
    font: 'sans', 
    spacing: 'normal' 
  });

  // --- SPACING CONFIG ---
  const spacingConfig = {
    compact: { gap: 'gap-3', mb: 'mb-3', py: 'py-4', sectionGap: 'space-y-4', headerMb: 'mb-6' },
    normal: { gap: 'gap-5', mb: 'mb-5', py: 'py-8', sectionGap: 'space-y-8', headerMb: 'mb-10' },
    spacious: { gap: 'gap-8', mb: 'mb-8', py: 'py-12', sectionGap: 'space-y-12', headerMb: 'mb-14' }
  };
  const s = spacingConfig[design.spacing];

  // --- RESUME DATA STATE ---
  const initialData = {
    personal: { fullName: user?.fullName || '', email: user?.primaryEmailAddress?.emailAddress || '', phone: '', title: '', location: '', linkedin: '', github: '', summary: '', photo: null },
    experience: [],
    education: [],
    skills: []
  };

  const [resumeData, setResumeData] = useState(initialData);

  // 1. FETCH DATA
  useEffect(() => {
    if (!isUserLoaded || !user) return;
    const fetchResume = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/resume/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.personal || data.experience)) {
            setResumeData(prev => ({
              ...prev,
              personal: { ...prev.personal, ...data.personal },
              experience: data.experience || [],
              education: data.education || [],
              skills: data.skills || []
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load resume:", err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    fetchResume();
  }, [isUserLoaded, user]);

  // 2. AUTO-SAVE
  useEffect(() => {
    if (!isDataLoaded || !user) return;
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await fetch('http://localhost:5000/api/resume/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...resumeData })
        });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }, 1000); 
    return () => clearTimeout(timer);
  }, [resumeData, isDataLoaded, user]);

  // --- ACTIONS ---
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${resumeData.personal.fullName || 'Resume'}_CV`,
    onBeforeGetContent: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; } .print-content { transform: none !important; } }
    `
  });

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all data?")) setResumeData(initialData);
  };

  const handleAIAssist = async (type, contextId = null) => {
    setIsGenerating(true);
    let context = {};
    if (type === 'summary') {
      context = { title: resumeData.personal.title, skills: resumeData.skills.map(s => s.name).join(', ') };
    } else if (type === 'description') {
      const exp = resumeData.experience.find(e => e.id === contextId);
      if (!exp) return setIsGenerating(false);
      context = { role: exp.role, company: exp.company, description: exp.description };
    }

    try {
      const response = await fetch('http://localhost:5000/api/ai/resume-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context })
      });
      const data = await response.json();
      if (data.result) {
        if (type === 'summary') {
          setResumeData(prev => ({ ...prev, personal: { ...prev.personal, summary: data.result } }));
        } else if (type === 'description') {
          setResumeData(prev => ({
            ...prev,
            experience: prev.experience.map(e => e.id === contextId ? { ...e, description: data.result } : e)
          }));
        }
      }
    } catch (err) {
      alert("AI Service unavailable.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResumeData(prev => ({
          ...prev,
          personal: { ...prev.personal, photo: reader.result }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HELPERS ---
  const updatePersonal = (field, value) => setResumeData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  const addExperience = () => setResumeData(prev => ({ ...prev, experience: [...prev.experience, { id: Date.now(), company: '', role: '', startDate: '', endDate: '', description: '' }] }));
  const updateExperience = (id, field, value) => setResumeData(prev => ({ ...prev, experience: prev.experience.map(e => e.id === id ? { ...e, [field]: value } : e) }));
  const removeExperience = (id) => setResumeData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }));
  const addEducation = () => setResumeData(prev => ({ ...prev, education: [...prev.education, { id: Date.now(), school: '', degree: '', year: '' }] }));
  const updateEducation = (id, field, value) => setResumeData(prev => ({ ...prev, education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e) }));
  const removeEducation = (id) => setResumeData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  const addSkill = () => setResumeData(prev => ({ ...prev, skills: [...prev.skills, { id: Date.now(), name: '', level: 'Intermediate' }] }));
  const updateSkill = (id, field, value) => setResumeData(prev => ({ ...prev, skills: prev.skills.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  const removeSkill = (id) => setResumeData(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));

  const tabs = [
    { id: 'personal', label: 'Profile', icon: User },
    { id: 'experience', label: 'Work', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
  ];

  // Visual representation of templates
  const TemplateThumbnail = ({ type, isActive }) => {
    const baseClass = `relative h-24 w-full rounded-lg border-2 transition-all overflow-hidden ${isActive ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' : 'border-gray-200 hover:border-gray-400'}`;
    const activeColor = isActive ? 'bg-fuchsia-500' : 'bg-gray-300';
    const bgClass = isActive ? 'bg-fuchsia-50' : 'bg-white';

    switch (type) {
      case 'modern':
        return (
          <div className={baseClass}>
            <div className="flex h-full">
              <div className={`w-1/3 h-full ${bgClass} border-r border-gray-100 p-1 flex flex-col gap-1`}>
                <div className={`w-4 h-4 rounded-full ${activeColor} mb-1 self-center`} />
                <div className="w-full h-1 bg-gray-100 rounded" />
                <div className="w-full h-1 bg-gray-100 rounded" />
              </div>
              <div className="flex-1 p-1 flex flex-col gap-1">
                <div className="w-3/4 h-2 bg-gray-200 rounded mb-1" />
                <div className="w-full h-1 bg-gray-100 rounded" />
                <div className="w-full h-1 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        );
      case 'professional':
        return (
          <div className={baseClass}>
             <div className="p-2 flex flex-col h-full">
               <div className="w-full h-4 border-b border-gray-200 mb-1 flex items-end justify-between">
                 <div className="w-1/2 h-2 bg-gray-800 rounded"/>
               </div>
               <div className="flex gap-2 h-full">
                 <div className={`w-1/4 h-full border-r border-gray-100 ${isActive ? 'text-fuchsia-500' : 'text-gray-300'} text-[6px] font-bold`}>EXP</div>
                 <div className="flex-1 flex flex-col gap-1">
                    <div className="w-full h-1 bg-gray-100 rounded" />
                    <div className="w-full h-1 bg-gray-100 rounded" />
                 </div>
               </div>
             </div>
          </div>
        );
      case 'creative':
        return (
          <div className={baseClass}>
            <div className="flex h-full">
               <div className={`w-6 h-full ${activeColor} flex flex-col items-center pt-2`}>
                  <div className="w-1 h-8 bg-white/30 rounded" />
               </div>
               <div className="flex-1 p-2 flex flex-col gap-1">
                  <div className="w-full h-4 border-b-2 border-gray-800 mb-1" />
                  <div className="flex gap-2">
                     <div className="w-2/3 h-10 bg-gray-50 rounded" />
                     <div className="flex-1 h-10 bg-gray-50 rounded" />
                  </div>
               </div>
            </div>
          </div>
        );
      case 'minimal':
        return (
          <div className={baseClass}>
            <div className="p-2 flex flex-col items-center h-full pt-3">
               <div className="w-1/2 h-2 bg-gray-800 rounded mb-1" />
               <div className={`w-1/4 h-1 rounded mb-3 ${activeColor}`} />
               <div className="w-full h-1 bg-gray-100 rounded mb-1" />
               <div className="w-full h-1 bg-gray-100 rounded" />
            </div>
          </div>
        );
      case 'classic':
      default:
        return (
           <div className={baseClass}>
             <div className={`w-full h-6 ${activeColor} mb-1`} />
             <div className="p-1 grid grid-cols-3 gap-1">
                <div className="col-span-2 space-y-1">
                   <div className="w-full h-1 bg-gray-100 rounded" />
                   <div className="w-full h-1 bg-gray-100 rounded" />
                </div>
                <div className="space-y-1">
                   <div className="w-full h-1 bg-gray-100 rounded" />
                   <div className="w-full h-1 bg-gray-100 rounded" />
                </div>
             </div>
           </div>
        );
    }
  };

  if (!isUserLoaded || !isDataLoaded) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-indigo-600"><Loader2 className="animate-spin mr-2"/> Loading Studio...</div>;
  }

  // --- RENDER ---
  return (
    <div className="h-[calc(100vh-0px)] bg-gray-100 flex overflow-hidden relative font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
      
      {/* 1. TOP FLOATING TOOLBAR (Unchanged) */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-xl p-2 pl-4 rounded-full shadow-2xl border border-white/50 transition-all duration-300 ${previewMode ? 'translate-y-[-150%]' : ''}`}
      >
        <button type="button" onClick={() => { setIsEditorOpen(!isEditorOpen); setIsDesignOpen(false); }} className={`p-3 rounded-full transition-all ${isEditorOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}><Edit3 size={20} /></button>
        <div className="w-px h-6 bg-gray-300/50 mx-2" />
        <button type="button" onClick={() => { setIsDesignOpen(!isDesignOpen); setIsEditorOpen(false); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isDesignOpen ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><Palette size={18} /><span>Design</span></button>
        <div className="flex items-center gap-1 bg-gray-100/50 rounded-full p-1 border border-gray-200 ml-2">
          <button type="button" onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))} className="p-2 text-gray-500 hover:bg-white rounded-full"><ZoomOut size={16}/></button>
          <span className="text-xs font-mono text-gray-600 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button type="button" onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-2 text-gray-500 hover:bg-white rounded-full"><ZoomIn size={16}/></button>
        </div>
        <div className="w-px h-6 bg-gray-300/50 mx-2" />
        <button type="button" onClick={handlePrint} disabled={isPrinting} className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-95">
          {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} {isPrinting ? 'Preparing...' : 'Export'}
        </button>
      </motion.div>

      {/* 2. LEFT: EDITOR DRAWER */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            variants={drawerVariants}
            initial="hidden" animate="visible" exit="hidden"
            className="absolute left-0 top-0 h-full w-[420px] bg-white/90 backdrop-blur-2xl border-r border-white/50 shadow-2xl z-40 flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><FileText size={20}/></div>Content</h2>
              <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex justify-around p-4 pb-0 bg-white/50">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1.5 pb-3 px-4 text-xs font-bold transition-all relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`p-3 rounded-2xl ${activeTab === tab.id ? 'bg-indigo-50 shadow-inner' : 'bg-transparent'}`}><tab.icon size={20} /></div>{tab.label}{activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar bg-gradient-to-b from-white/50 to-white/80">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                   {activeTab === 'personal' && (
                    <div className="space-y-4">
                      <div className="flex justify-center mb-6">
                         <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                               {resumeData.personal.photo ? <img src={resumeData.personal.photo} alt="Profile" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-400" />}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Upload size={20} className="text-white" />
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoUpload} />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Full Name" value={resumeData.personal.fullName} onChange={(e) => updatePersonal('fullName', e.target.value)} />
                        <InputGroup label="Job Title" placeholder="e.g. Developer" value={resumeData.personal.title} onChange={(e) => updatePersonal('title', e.target.value)} />
                      </div>
                      <InputGroup label="Email" value={resumeData.personal.email} onChange={(e) => updatePersonal('email', e.target.value)} />
                      <InputGroup label="Phone" value={resumeData.personal.phone} onChange={(e) => updatePersonal('phone', e.target.value)} />
                      <InputGroup label="Location" value={resumeData.personal.location} onChange={(e) => updatePersonal('location', e.target.value)} />
                      <div className="relative mt-8 group">
                        <div className="flex justify-between items-center mb-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Summary</label>
                           <button onClick={() => handleAIAssist('summary')} disabled={isGenerating} className="text-xs flex items-center gap-1.5 text-white font-bold px-4 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full shadow-lg disabled:opacity-50">
                             {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} AI Write
                           </button>
                        </div>
                        <InputGroup multiline value={resumeData.personal.summary} onChange={(e) => updatePersonal('summary', e.target.value)} placeholder="Professional summary..." />
                      </div>
                    </div>
                  )}

                  {activeTab === 'experience' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Experience</h3><button onClick={addExperience} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"><Plus size={14} /> Add Role</button></div>
                      <Reorder.Group axis="y" values={resumeData.experience} onReorder={(newOrder) => setResumeData(prev => ({ ...prev, experience: newOrder }))}>
                        {resumeData.experience.map((exp, index) => (
                          <Reorder.Item key={exp.id} value={exp} className="mb-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg relative group">
                               <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500"><GripVertical size={16}/></div>
                               <div className="pl-6">
                                 <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                 <InputGroup label="Company" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                                 <InputGroup label="Role" value={exp.role} onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} />
                                 <div className="grid grid-cols-2 gap-4"><InputGroup label="Start" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} /><InputGroup label="End" value={exp.endDate} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} /></div>
                                 <div className="relative mt-2"><button onClick={() => handleAIAssist('description', exp.id)} disabled={isGenerating} className="absolute right-0 -top-8 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md font-bold flex items-center gap-1"><Sparkles size={10} /> Enhance</button><InputGroup multiline label="Responsibilities" value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} /></div>
                               </div>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  )}

                  {activeTab === 'education' && (
                    <div className="space-y-6">
                       <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Education</h3><button onClick={addEducation} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"><Plus size={14} /> Add School</button></div>
                       <Reorder.Group axis="y" values={resumeData.education} onReorder={(newOrder) => setResumeData(prev => ({ ...prev, education: newOrder }))}>
                         {resumeData.education.map((edu) => (
                           <Reorder.Item key={edu.id} value={edu} className="mb-4">
                             <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg relative group">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 cursor-grab hover:text-gray-500"><GripVertical size={16}/></div>
                                <div className="pl-6">
                                   <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                   <InputGroup label="School" value={edu.school} onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} />
                                   <div className="grid grid-cols-2 gap-4"><InputGroup label="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} /><InputGroup label="Year" value={edu.year} onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} /></div>
                                </div>
                             </div>
                           </Reorder.Item>
                         ))}
                       </Reorder.Group>
                    </div>
                  )}

                  {activeTab === 'skills' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Skills</h3><button onClick={addSkill} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"><Plus size={14} /> Add Skill</button></div>
                      <Reorder.Group axis="y" values={resumeData.skills} onReorder={(newOrder) => setResumeData(prev => ({ ...prev, skills: newOrder }))}>
                        <div className="space-y-3">
                          {resumeData.skills.map((skill) => (
                            <Reorder.Item key={skill.id} value={skill}>
                              <div className="flex gap-3 items-center bg-white p-2 pl-2 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-gray-300 cursor-grab hover:text-gray-500"><GripVertical size={16}/></div>
                                <Code size={16} className="text-gray-400" />
                                <input className="flex-1 bg-transparent text-sm outline-none font-medium text-gray-700" value={skill.name} onChange={(e) => updateSkill(skill.id, 'name', e.target.value)} placeholder="Skill name" />
                                <button onClick={() => removeSkill(skill.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                              </div>
                            </Reorder.Item>
                          ))}
                        </div>
                      </Reorder.Group>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. RIGHT: DESIGN STUDIO PANEL */}
      <AnimatePresence>
        {isDesignOpen && (
          <motion.div 
            variants={designPanelVariants}
            initial="hidden" animate="visible" exit="hidden"
            className="absolute right-0 top-0 h-full w-[400px] bg-white/90 backdrop-blur-2xl border-l border-white/50 shadow-[0_0_40px_rgba(0,0,0,0.1)] z-40 flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><div className="p-2 bg-fuchsia-100 text-fuchsia-600 rounded-xl"><Palette size={20}/></div>Design</h2>
              <button onClick={() => setIsDesignOpen(false)} className="text-gray-400 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar space-y-8">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Grid size={14}/> Layout</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['modern', 'professional', 'creative', 'minimal', 'classic'].map(t => (
                    <div key={t} className="cursor-pointer group" onClick={() => setDesign({...design, template: t})}>
                       <TemplateThumbnail type={t} isActive={design.template === t} />
                       <div className={`text-center text-xs font-bold mt-2 uppercase ${design.template === t ? 'text-fuchsia-600' : 'text-gray-500'}`}>{t}</div>
                    </div>
                  ))}
                </div>
              </section>
              {/* ... Colors, Typography, Spacing Sections (Same as before) ... */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Palette size={14}/> Colors</h3>
                <div className="flex flex-wrap gap-3">
                  {['#4f46e5', '#059669', '#e11d48', '#d97706', '#0f172a', '#9333ea'].map(c => (
                    <button key={c} onClick={() => setDesign({...design, accentColor: c})} className={`w-10 h-10 rounded-full border-4 shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${design.accentColor === c ? 'border-gray-200 scale-110' : 'border-white'}`} style={{ backgroundColor: c }}>
                      {design.accentColor === c && <CheckCircle size={16} className="text-white drop-shadow-md"/>}
                    </button>
                  ))}
                  <label className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"><Plus size={16} className="text-gray-400"/><input type="color" value={design.accentColor} onChange={(e) => setDesign({...design, accentColor: e.target.value})} className="hidden" /></label>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Type size={14}/> Typography</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['sans', 'serif', 'mono'].map(f => (
                     <button key={f} onClick={() => setDesign({...design, font: f})} className={`py-3 rounded-xl text-xs font-bold border transition-all capitalize font-${f} ${design.font === f ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>{f}</button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Maximize size={14}/> Spacing</h3>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                  {['compact', 'normal', 'spacious'].map(sp => (
                    <button key={sp} onClick={() => setDesign({...design, spacing: sp})} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${design.spacing === sp ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{sp}</button>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#e5e5e5]" onMouseDown={() => setPreviewMode(true)} onMouseUp={() => setPreviewMode(false)}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#a3a3a3 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="flex-1 overflow-auto flex items-start justify-center pt-32 pb-32 custom-scrollbar outline-none" style={{ cursor: 'grab' }}>
           <motion.div layout style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} className="shadow-2xl transition-shadow duration-300 print:transform-none print:shadow-none print:m-0">
              <div ref={printRef} className={`w-[210mm] min-h-[297mm] bg-white text-gray-900 overflow-hidden relative selection:bg-gray-200 ${design.font === 'serif' ? 'font-serif' : design.font === 'mono' ? 'font-mono' : 'font-sans'}`}>
                
                {/* MODERN TEMPLATE (Updated with Photo) */}
                {design.template === 'modern' && (
                  <div className="flex h-full min-h-[297mm]">
                    <div className={`w-1/3 p-8 border-r border-gray-100 bg-gray-50/50 ${s.py}`}>
                       <div className={`${s.headerMb} flex justify-center`}>
                         <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: design.accentColor }}>
                           {resumeData.personal.photo ? <img src={resumeData.personal.photo} className="w-full h-full object-cover" /> : resumeData.personal.fullName?.[0]}
                         </div>
                       </div>
                       {/* ... rest of modern sidebar ... */}
                       <div className={s.sectionGap + " flex flex-col"}>
                          <div>
                            <h3 className={`text-xs font-bold uppercase tracking-widest ${s.mb} border-b-2 pb-1`} style={{ borderColor: design.accentColor, color: design.accentColor }}>Contact</h3>
                            <div className={`space-y-3 text-xs text-gray-600 font-medium ${s.gap}`}>
                              {resumeData.personal.email && <div className="flex gap-3 items-center"><Mail size={12}/>{resumeData.personal.email}</div>}
                              {resumeData.personal.phone && <div className="flex gap-3 items-center"><Phone size={12}/>{resumeData.personal.phone}</div>}
                              {resumeData.personal.location && <div className="flex gap-3 items-center"><MapPin size={12}/>{resumeData.personal.location}</div>}
                            </div>
                          </div>
                          <div>
                            <h3 className={`text-xs font-bold uppercase tracking-widest ${s.mb} border-b-2 pb-1`} style={{ borderColor: design.accentColor, color: design.accentColor }}>Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {resumeData.skills.map(s => <span key={s.id} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-700 font-semibold shadow-sm">{s.name}</span>)}
                            </div>
                          </div>
                          <div>
                             <h3 className={`text-xs font-bold uppercase tracking-widest ${s.mb} border-b-2 pb-1`} style={{ borderColor: design.accentColor, color: design.accentColor }}>Education</h3>
                             {resumeData.education.map(edu => (
                               <div key={edu.id} className="mb-6 last:mb-0">
                                 <div className="font-bold text-gray-900 text-sm">{edu.school}</div>
                                 <div className="text-xs text-gray-600 font-medium">{edu.degree}</div>
                                 <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{edu.year}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    {/* ... rest of modern main ... */}
                    <div className="flex-1 p-12">
                       <div className={s.headerMb}>
                         <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight" style={{ color: design.accentColor }}>{resumeData.personal.fullName || 'YOUR NAME'}</h1>
                         <p className="text-xl text-gray-500 font-medium tracking-wide uppercase">{resumeData.personal.title || 'Professional Title'}</p>
                       </div>
                       <div className={s.sectionGap + " flex flex-col"}>
                          {resumeData.personal.summary && <div><h3 className={`text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 ${s.mb} text-gray-800`}>Profile</h3><p className="text-sm text-gray-600 leading-relaxed">{resumeData.personal.summary}</p></div>}
                          <div>
                             <h3 className={`text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 ${s.mb} text-gray-800`}>Experience</h3>
                             <div className={s.gap}>
                               {resumeData.experience.map(exp => (
                                 <div key={exp.id} className="mb-6 last:mb-0">
                                   <div className="flex justify-between items-baseline mb-1">
                                     <h4 className="font-bold text-gray-900 text-lg">{exp.role}</h4>
                                     <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{exp.startDate} - {exp.endDate}</span>
                                   </div>
                                   <div className="text-xs font-bold uppercase mb-3 tracking-wide" style={{ color: design.accentColor }}>{exp.company}</div>
                                   <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                                 </div>
                               ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* CREATIVE TEMPLATE (Updated with Photo) */}
                {design.template === 'creative' && (
                  <div className="flex h-full min-h-[297mm]">
                    <div className="w-[80px] flex flex-col items-center py-10 gap-8" style={{ backgroundColor: design.accentColor }}>
                       {resumeData.personal.photo ? 
                          <img src={resumeData.personal.photo} className="w-14 h-14 rounded-full object-cover border-2 border-white/50" /> 
                          : <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">{resumeData.personal.fullName?.[0]}</div>
                       }
                       <div className="text-white font-black text-6xl -rotate-90 origin-center whitespace-nowrap mt-20 opacity-20 tracking-widest">CV</div>
                    </div>
                    {/* ... rest of creative content ... */}
                    <div className="flex-1 p-14">
                         <header className={`mb-16 border-b-8 border-gray-900 pb-8 flex justify-between items-start ${s.headerMb}`}>
                            <div>
                               <h1 className="text-7xl font-black text-gray-900 leading-[0.8] mb-2">{resumeData.personal.fullName?.split(' ')[0]}<br/><span className="text-gray-300">{resumeData.personal.fullName?.split(' ')[1]}</span></h1>
                            </div>
                            <div className="text-right">
                               <div className="bg-gray-900 text-white text-xl font-bold px-4 py-2 inline-block mb-2 transform -skew-x-12">{resumeData.personal.title}</div>
                               <div className="text-xs font-bold text-gray-500">
                                  <div>{resumeData.personal.email}</div>
                                  <div>{resumeData.personal.phone}</div>
                               </div>
                            </div>
                         </header>
                         <div className="grid grid-cols-3 gap-12">
                            <div className="col-span-2 space-y-12">
                               {resumeData.personal.summary && <section><h3 className="font-black text-2xl mb-4 flex gap-2 items-center"><span className="w-3 h-3 rounded-full bg-gray-900"></span> PROFILE</h3><p className="text-sm font-medium text-gray-600 leading-8">{resumeData.personal.summary}</p></section>}
                               {resumeData.experience.length > 0 && <section><h3 className="font-black text-2xl mb-6 flex gap-2 items-center"><span className="w-3 h-3 rounded-full bg-gray-900"></span> WORK</h3><div className="space-y-10 border-l-4 border-gray-100 pl-8 ml-1.5">{resumeData.experience.map(exp => (<div key={exp.id} className="relative"><div className="absolute -left-[42px] top-2 w-5 h-5 rounded-full border-4 border-white shadow-sm" style={{backgroundColor: design.accentColor}}></div><h4 className="font-black text-xl text-gray-900">{exp.role}</h4><div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">{exp.company} | {exp.startDate}</div><p className="text-sm text-gray-600 font-medium leading-relaxed">{exp.description}</p></div>))}</div></section>}
                            </div>
                            <div className="space-y-12">
                               <section><h3 className="font-black text-2xl mb-6">SKILLS</h3><div className="flex flex-col gap-2">{resumeData.skills.map(s => <div key={s.id} className="text-sm font-bold text-gray-700 border-b-2 border-gray-100 pb-2">{s.name}</div>)}</div></section>
                               <section><h3 className="font-black text-2xl mb-6">EDU</h3>{resumeData.education.map(edu => (<div key={edu.id} className="mb-4"><div className="font-bold text-gray-900">{edu.school}</div><div className="text-xs text-gray-500 font-bold">{edu.degree}</div></div>))}</section>
                            </div>
                         </div>
                      </div>
                  </div>
                )}

                {/* --- TEMPLATE 3: PROFESSIONAL (Updated) --- */}
                {design.template === 'professional' && (
                   <div className="h-full p-16">
                     <div className={`border-b-4 border-gray-900 pb-10 ${s.headerMb} flex justify-between items-end`}>
                        <div className="flex items-center gap-6">
                           {resumeData.personal.photo && <img src={resumeData.personal.photo} className="w-24 h-24 object-cover border border-gray-200" />}
                           <div>
                             <h1 className="text-5xl font-serif font-black text-gray-900 tracking-tight leading-none mb-2">{resumeData.personal.fullName || 'YOUR NAME'}</h1>
                             <p className="text-lg font-sans font-bold uppercase tracking-widest" style={{ color: design.accentColor }}>{resumeData.personal.title || 'Title'}</p>
                           </div>
                        </div>
                        <div className="text-right text-xs font-bold text-gray-500 space-y-1">
                           <div>{resumeData.personal.email}</div>
                           <div>{resumeData.personal.phone}</div>
                           <div>{resumeData.personal.location}</div>
                        </div>
                     </div>
                     {/* ... rest of professional layout ... */}
                     <div className={`space-y-12 ${s.sectionGap}`}>
                        {resumeData.personal.summary && (
                           <div className="grid grid-cols-4 gap-8">
                              <div className="text-right text-xs font-black uppercase tracking-widest pt-1" style={{ color: design.accentColor }}>Profile</div>
                              <div className="col-span-3 text-sm text-gray-700 leading-relaxed font-serif">{resumeData.personal.summary}</div>
                           </div>
                        )}
                        {resumeData.experience.length > 0 && (
                           <div className="grid grid-cols-4 gap-8">
                              <div className="text-right text-xs font-black uppercase tracking-widest pt-1" style={{ color: design.accentColor }}>Experience</div>
                              <div className="col-span-3 space-y-8 border-l-2 border-gray-100 pl-8">
                                 {resumeData.experience.map(exp => (
                                    <div key={exp.id}>
                                       <div className="flex justify-between items-baseline mb-1">
                                          <h4 className="font-serif font-bold text-gray-900 text-lg">{exp.role}</h4>
                                          <span className="text-xs font-sans font-bold text-gray-400">{exp.startDate} – {exp.endDate}</span>
                                       </div>
                                       <div className="text-xs font-bold uppercase mb-2 text-gray-500">{exp.company}</div>
                                       <p className="text-sm text-gray-600 leading-relaxed font-serif">{exp.description}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                        {resumeData.education.length > 0 && (
                           <div className="grid grid-cols-4 gap-8">
                              <div className="text-right text-xs font-black uppercase tracking-widest pt-1" style={{ color: design.accentColor }}>Education</div>
                              <div className="col-span-3 space-y-4 border-l-2 border-gray-100 pl-8">
                                 {resumeData.education.map(edu => (
                                    <div key={edu.id}>
                                       <div className="font-serif font-bold text-gray-900">{edu.school}</div>
                                       <div className="text-sm text-gray-600">{edu.degree}, {edu.year}</div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                   </div>
                )}

                {/* --- TEMPLATE 4: MINIMAL --- */}
                {design.template === 'minimal' && (
                  <div className="h-full p-20 flex flex-col items-center">
                     <div className={`text-center ${s.headerMb} w-full border-b border-gray-200 pb-10`}>
                        {resumeData.personal.photo && <img src={resumeData.personal.photo} className="w-20 h-20 rounded-full mx-auto mb-6 object-cover grayscale" />}
                        <h1 className="text-5xl font-light tracking-[0.1em] text-gray-900 mb-4">{resumeData.personal.fullName}</h1>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-8" style={{color: design.accentColor}}>{resumeData.personal.title}</p>
                        <div className="flex justify-center gap-8 text-xs font-medium text-gray-400 font-mono">
                           <span>{resumeData.personal.email}</span>
                           <span>{resumeData.personal.phone}</span>
                           <span>{resumeData.personal.location}</span>
                        </div>
                     </div>
                     {/* ... rest of minimal ... */}
                     <div className={`max-w-2xl w-full space-y-16 ${s.sectionGap}`}>
                         {resumeData.personal.summary && <p className="text-center text-gray-600 italic text-sm leading-8">{resumeData.personal.summary}</p>}
                         {resumeData.experience.length > 0 && <section><h3 className="text-center text-xs font-bold uppercase tracking-widest mb-10 text-gray-300">Experience</h3><div className="space-y-12">{resumeData.experience.map(exp => (<div key={exp.id} className="grid grid-cols-4 gap-6"><div className="text-right text-xs font-bold text-gray-400 pt-1">{exp.startDate}</div><div className="col-span-3"><h4 className="font-bold text-gray-900 text-lg">{exp.role}</h4><div className="text-xs font-bold uppercase text-gray-400 mb-3">{exp.company}</div><p className="text-sm text-gray-600 leading-relaxed">{exp.description}</p></div></div>))}</div></section>}
                      </div>
                  </div>
                )}

                {/* --- TEMPLATE 5: CLASSIC --- */}
                {design.template === 'classic' && (
                   <div className="h-full font-serif">
                      <div className={`p-14 text-white ${s.headerMb} flex items-center justify-between`} style={{ backgroundColor: design.accentColor }}>
                         <div>
                           <h1 className="text-4xl font-bold tracking-wide mb-2">{resumeData.personal.fullName}</h1>
                           <p className="text-lg opacity-90 italic">{resumeData.personal.title}</p>
                           <div className="mt-8 pt-4 border-t border-white/30 flex gap-8 text-sm opacity-80">
                              <span>{resumeData.personal.email}</span><span>{resumeData.personal.phone}</span>
                           </div>
                         </div>
                         {resumeData.personal.photo && <img src={resumeData.personal.photo} className="w-32 h-32 object-cover border-4 border-white shadow-lg" />}
                      </div>
                      {/* ... rest of classic ... */}
                      <div className="px-14 grid grid-cols-3 gap-12">
                         <div className="col-span-2 space-y-10">
                            {resumeData.personal.summary && <section><h3 className="font-bold text-gray-900 uppercase text-sm border-b-2 border-gray-800 mb-4 pb-1">Profile</h3><p className="text-gray-700 text-sm leading-relaxed">{resumeData.personal.summary}</p></section>}
                            {resumeData.experience.length > 0 && <section><h3 className="font-bold text-gray-900 uppercase text-sm border-b-2 border-gray-800 mb-6 pb-1">Experience</h3><div className="space-y-8">{resumeData.experience.map(exp => (<div key={exp.id}><div className="flex justify-between font-bold text-gray-900 text-lg"><span>{exp.company}</span><span className="text-sm font-normal text-gray-500 font-sans">{exp.startDate}</span></div><div className="text-sm italic font-semibold mb-2" style={{color: design.accentColor}}>{exp.role}</div><p className="text-sm text-gray-700 leading-relaxed">{exp.description}</p></div>))}</div></section>}
                         </div>
                         <div className="space-y-10">
                            <section><h3 className="font-bold text-gray-900 uppercase text-sm border-b-2 border-gray-800 mb-4 pb-1">Education</h3>{resumeData.education.map(edu => (<div key={edu.id} className="mb-4"><div className="font-bold text-gray-900">{edu.school}</div><div className="text-sm text-gray-600 italic">{edu.degree}</div><div className="text-xs text-gray-500 mt-1">{edu.year}</div></div>))}</section>
                            <section><h3 className="font-bold text-gray-900 uppercase text-sm border-b-2 border-gray-800 mb-4 pb-1">Skills</h3><ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">{resumeData.skills.map(s => <li key={s.id}>{s.name}</li>)}</ul></section>
                         </div>
                      </div>
                   </div>
                )}
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;