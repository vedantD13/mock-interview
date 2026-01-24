import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Trophy, Star, Plus, Zap, Loader2 } from 'lucide-react';

const SkillTracker = () => {
  const { user } = useUser();
  const [skills, setSkills] = useState([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch Skills
  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5000/api/skills/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setSkills(data.skills);
          setXp(data.xp);
          setLoading(false);
        });
    }
  }, [user]);

  // Add Skill
  const handleAddSkill = async () => {
    const name = prompt("Enter skill name (e.g. React):");
    if (!name) return;

    const res = await fetch('http://localhost:5000/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, name, category: 'Technical', level: 0 })
    });
    const newSkill = await res.json();
    setSkills([...skills, newSkill]);
  };

  // Update Progress
  const handlePractice = async (skillId, currentLevel) => {
    const newLevel = Math.min(currentLevel + 10, 100);
    const res = await fetch(`http://localhost:5000/api/skills/${skillId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, level: newLevel })
    });
    const data = await res.json();
    
    // Update local state
    setSkills(skills.map(s => s._id === skillId ? data.skill : s));
    setXp(data.xp);
  };

  if (loading) return <div className="p-10 flex justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 pt-24">
      <header className="flex justify-between items-end mb-12">
        <div>
           <h1 className="text-3xl font-bold mb-2">Skill Tracker 🎯</h1>
           <p className="text-slate-400">Level up your abilities.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 border border-yellow-500/30 px-6 py-3 rounded-xl">
          <Trophy className="text-yellow-500" />
          <div>
            <div className="text-xs text-yellow-500 font-bold uppercase">Total XP</div>
            <div className="text-2xl font-bold">{xp}</div>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {skills.map((skill) => (
            <motion.div layout key={skill._id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><Zap size={20} /></div>
                  <h3 className="font-bold text-lg">{skill.name}</h3>
                </div>
                <button 
                  onClick={() => handlePractice(skill._id, skill.level)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                >
                  <Plus size={14} /> Practice (+10 XP)
                </button>
              </div>
              <div className="relative pt-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Level {Math.floor(skill.level / 10)}</span>
                  <span className="text-slate-400">{skill.level}%</span>
                </div>
                <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${skill.level}%` }} 
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>
            </motion.div>
          ))}
          
          <button onClick={handleAddSkill} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-slate-300 hover:border-slate-600 transition flex items-center justify-center gap-2">
            <Plus size={20} /> Add New Skill
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillTracker;