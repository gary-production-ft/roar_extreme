import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { admin, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !admin) {
      navigate('/admin/login');
    }
  }, [admin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-white/60">Verifying Admin Session...</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Analytics Overview', end: true },
    { to: '/admin/leads', icon: Users, label: 'Lead Management' },
    { to: '/admin/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row font-sans cursor-default select-auto">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#111111] border-r border-white/10 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-2xl text-white tracking-wider">
              ROAR <span className="text-[#FF5A1F]">EXTREME</span>
            </span>
          </div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-white/50 mt-1">
            Studio Management • Nashik
          </p>
        </div>

        {/* Current Admin Pill */}
        <div className="px-6 py-4 border-b border-white/5 bg-black/30">
          <p className="text-xs font-semibold text-white truncate">{admin.name}</p>
          <p className="text-[11px] text-white/50 truncate">{admin.email}</p>
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#FF5A1F]/10 text-[#FF5A1F] border border-[#FF5A1F]/30">
            {admin.role}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FF5A1F] text-black shadow-lg shadow-[#FF5A1F]/20'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Public Website</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-6 py-4 border-b border-white/10 bg-[#0E0E0E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs uppercase font-mono tracking-wider text-white/70">
              Live Backend Connected • MongoDB Ready
            </span>
          </div>
          <span className="text-xs font-mono text-white/40">
            {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </header>

        <div className="p-6 flex-1 bg-[#0A0A0A]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

