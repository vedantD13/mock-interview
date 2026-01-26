import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  Video, FileText, BarChart2, Target, Map, 
  ArrowUpRight, TrendingUp, Clock, Zap, ArrowRight 
} from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 82 },
  { name: 'Sat', score: 90 },
  { name: 'Sun', score: 95 },
];

const blurInVariants = {
  hidden: { filter: 'blur(10px)', opacity: 0, y: 20 },
  visible: { filter: 'blur(0px)', opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const SpotlightCard = ({ icon: Icon, title, description, path, color, gradient }) => {
  const navigate = useNavigate();
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const position = { x: useMotionValue(0), y: useMotionValue(0) };
  
  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    position.x.set(e.clientX - rect.left);
    position.y.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      onClick={() => navigate(path)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl p-6 shadow-xl shadow-${color}-900/5 cursor-pointer group`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${position.x}px ${position.y}px,
              rgba(255, 255, 255, 0.8),
              transparent 80%
            )
          `,
        }}
      />
      
      <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center text-white mb-6 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={28} />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">{title}</h3>
      <p className="text-gray-600 text-sm mb-6 relative z-10 font-medium leading-relaxed">{description}</p>
      
      <div className={`flex items-center text-sm font-bold text-${color}-600 group-hover:translate-x-2 transition-transform relative z-10`}>
        Explore <ArrowRight size={16} className="ml-1" />
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  if (!isLoaded) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={blurInVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg font-medium">
            {isSignedIn 
              ? `Welcome back, ${user.firstName}! Ready to level up?` 
              : "Welcome, Guest! Explore our AI-powered interview tools."}
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/skill-tracker')}
            className="px-5 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-white flex items-center gap-2 transition-colors"
          >
            <Clock size={18} className="text-indigo-600" /> History
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/interview')}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Zap size={18} fill="currentColor" /> Quick Start
          </motion.button>
        </div>
      </motion.div>

      {/* Main Stats Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl shadow-indigo-100/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><TrendingUp size={20} /></div>
              Performance Trend
            </h2>
            {!isSignedIn && <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">Demo Mode</span>}
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Feature Card (Gradient) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-8 rounded-3xl text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-indigo-900/30"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full -ml-10 -mb-10 blur-2xl" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Weekly Goal</h2>
            <p className="text-indigo-100 font-medium">You're crushing it! Keep going.</p>
            
            <div className="mt-10 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2 font-bold text-indigo-100">
                  <span>Progress</span>
                  <span>80%</span>
                </div>
                <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                  <div className="text-3xl font-bold">12</div>
                  <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider mt-1">Interviews</div>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                  <div className="text-3xl font-bold">85</div>
                  <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider mt-1">Avg Score</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grid Features */}
      <h2 className="text-2xl font-bold text-gray-900 mt-4 pl-1">Tools & Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SpotlightCard 
          icon={Video}
          title="Mock Interview"
          description="AI-driven interviews tailored to your role."
          path="/interview"
          color="indigo"
          gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
        />
        <SpotlightCard 
          icon={FileText}
          title="Resume Builder"
          description="Create ATS-friendly resumes that stand out."
          path="/resume-builder"
          color="purple"
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
        <SpotlightCard 
          icon={BarChart2}
          title="Skill Tracker"
          description="Monitor your technical growth over time."
          path="/skill-tracker"
          color="emerald"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <SpotlightCard 
          icon={Target}
          title="Market Insights"
          description="Stay updated with latest industry trends."
          path="/market-insights"
          color="amber"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>
    </div>
  );
};

export default Dashboard;