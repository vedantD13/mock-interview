import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const salaryData = [
  { name: 'Jr. Dev', salary: 60000 },
  { name: 'Mid Dev', salary: 95000 },
  { name: 'Sr. Dev', salary: 140000 },
  { name: 'Lead', salary: 180000 },
];

const demandData = [
  { month: 'Jan', demand: 4000 },
  { month: 'Feb', demand: 3000 },
  { month: 'Mar', demand: 5000 },
  { month: 'Apr', demand: 4500 },
  { month: 'May', demand: 6000 },
];

const MarketInsights = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 pt-24">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Market Insights 🌎</h1>
        <p className="text-slate-400">Real-time data on the tech job market.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <KPICard icon={TrendingUp} label="Market Demand" value="+12%" color="text-green-400" />
        <KPICard icon={DollarSign} label="Avg. Base Salary" value="$112k" color="text-blue-400" />
        <KPICard icon={Users} label="Active Listings" value="4,520" color="text-purple-400" />
        <KPICard icon={Globe} label="Top Region" value="Remote" color="text-orange-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Salary Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800"
        >
          <h3 className="text-xl font-bold mb-6">Salary Ranges (USD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Bar dataKey="salary" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Demand Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800"
        >
          <h3 className="text-xl font-bold mb-6">Hiring Trend (2024)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Line type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Hot Skills */}
        <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-xl font-bold mb-4">🔥 Most In-Demand Skills</h3>
          <div className="flex flex-wrap gap-3">
             {["React", "Next.js", "TypeScript", "Python", "AWS", "Docker", "Kubernetes", "GraphQL", "System Design"].map((skill, i) => (
               <span key={i} className="px-4 py-2 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 rounded-lg cursor-pointer transition">
                 {skill}
               </span>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-slate-950 ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  </div>
);

export default MarketInsights;