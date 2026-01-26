import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex selection:bg-indigo-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:block transition-all duration-300 relative z-30">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar & Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
             <Sidebar isMobile onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Colorful Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 bg-[#f8fafc]">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/30" />
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 blur-[100px]" />
          <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-100/40 blur-[100px]" />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between sticky top-0 z-40 relative">
          <span className="font-bold text-lg text-gray-800">AI Prep</span>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth relative z-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;