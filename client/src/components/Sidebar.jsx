import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, UserButton, SignInButton, useClerk } from '@clerk/clerk-react';
import { 
  LayoutDashboard, Video, FileText, BarChart2, 
  Target, Map, ArrowRight, Sparkles, ChevronLeft, ChevronRight, LogIn, LogOut 
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ isMobile, onClose, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Video, label: 'Mock Interview', path: '/interview' },
    { icon: FileText, label: 'Resume Builder', path: '/resume-builder' },
    { icon: BarChart2, label: 'Skill Tracker', path: '/skill-tracker' },
    { icon: Target, label: 'Market Insights', path: '/market-insights' },
    { icon: Map, label: 'Career Path', path: '/career-path' },
  ];

  return (
    <motion.div 
      initial={false}
      animate={{ width: isMobile ? '100%' : (collapsed ? 80 : 280) }}
      className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative z-50 ${isMobile ? 'fixed inset-0' : 'sticky top-0'}`}
    >
      {/* High Visibility Toggle Button (Desktop Only) */}
      {!isMobile && (
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-12 bg-indigo-600 text-white rounded-full p-2 shadow-lg hover:bg-indigo-700 hover:scale-110 transition-all duration-200 z-50 border-4 border-gray-50 flex items-center justify-center"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      )}

      {/* Header */}
      <div className={`p-6 flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between'} min-h-[88px]`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-md shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="font-bold text-xl text-gray-800 tracking-tight whitespace-nowrap"
            >
              AI Prep
            </motion.span>
          )}
        </div>
        
        {isMobile && (
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={24} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={item.path}>
              <button
                onClick={() => {
                  navigate(item.path);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200' 
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-600'}`} />
                
                {(!collapsed || isMobile) && (
                  <>
                    <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                    {isActive && <ArrowRight className="w-4 h-4 ml-auto opacity-75" />}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
        {isSignedIn ? (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xl shadow-sm ${collapsed && !isMobile ? 'justify-center' : ''}`}>
              <UserButton afterSignOutUrl="/" />
              {(!collapsed || isMobile) && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-gray-700 truncate">{user?.fullName || 'User'}</span>
                  <span className="text-xs text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
              )}
            </div>
            
            {(!collapsed || isMobile) && (
               <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 p-2.5 rounded-xl transition-colors font-semibold border border-transparent hover:border-red-100"
               >
                 <LogOut size={18} /> End Session
               </button>
            )}
          </div>
        ) : (
          <SignInButton mode="modal">
            <button className={`flex items-center gap-2 w-full p-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all ${collapsed && !isMobile ? 'justify-center' : 'justify-center'}`}>
              <LogIn size={20} />
              {(!collapsed || isMobile) && <span>Sign In</span>}
            </button>
          </SignInButton>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;