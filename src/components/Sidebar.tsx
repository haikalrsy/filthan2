import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  GraduationCap,
  Vote
} from 'lucide-react';
import { UserProfile } from '../App';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  profile: UserProfile | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/app', end: true },
  ];

  if (profile?.role === 'admin' || profile?.role === 'guru') {
    menuItems.push(
      { icon: <Vote size={20} />, label: 'Sidang Keputusan', path: '/app/voting', end: false }
    );
  }

  if (profile?.role === 'admin') {
    menuItems.push(
      { icon: <Users size={20} />, label: 'Data Master Siswa', path: '/app/student-master', end: false },
      { icon: <Settings size={20} />, label: 'User Management', path: '/app/users', end: false }
    );
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen hidden md:flex shrink-0 z-20">
      <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 primary-gradient rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            N
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-widest leading-none uppercase font-mono italic">NeoVision</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 font-mono">Decision Protocol</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 pl-4 font-mono italic">Sector: Main Navigation</p>
          <nav className="space-y-2">
            {menuItems.map((item) => (
                  <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `
                   flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group
                   ${isActive
                    ? 'bg-[#f4f5f0] text-primary shadow-inner border border-[#e5e7e0] translate-x-1'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:translate-x-1'}
                 `}
              >
                {({ isActive }) => (
                  <>
                    <span className={`${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} transition-colors`}>
                      {item.icon}
                    </span>
                    <span className="font-bold text-[13px] uppercase tracking-tighter italic font-mono">
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1 h-4 rounded-full bg-primary"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-8 border-t border-gray-200 bg-gray-50">
        <div className="mb-6 px-4 py-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-default group space-y-2">
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-1 font-mono">Permission Protocol</p>
            <p className="text-xs font-black text-gray-600 capitalize group-hover:text-primary transition-colors font-mono">{profile?.role?.toUpperCase()}</p>
          </div>
          {profile?.role === 'siswa' && profile?.nisn && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-1 font-mono">NISN</p>
              <p className="text-xs font-black text-gray-600 font-mono tracking-widest">{profile.nisn}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-4 w-full text-gray-500 hover:text-primary hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all font-black tracking-widest text-[10px] group uppercase font-mono italic"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          Terminate session
        </button>
      </div>
    </aside>
  );
}
