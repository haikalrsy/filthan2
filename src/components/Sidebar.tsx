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
    <aside className="w-72 bg-[#0a0a0b] border-r border-[#1e1e24] flex flex-col sticky top-0 h-screen hidden md:flex shrink-0">
      <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 primary-gradient rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            N
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-widest leading-none uppercase font-mono italic">NeoVision</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 font-mono">Decision Protocol</p>
          </div>
        </div>

        <div className="mb-6">
           <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6 pl-4 font-mono italic">Sector: Main Navigation</p>
           <nav className="space-y-2">
             {menuItems.map((item) => (
               <NavLink
                 key={item.path}
                 to={item.path}
                 end={item.end}
                 className={({ isActive }) => `
                   flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group
                   ${isActive 
                     ? 'bg-[#1a1a20] text-primary shadow-inner border border-[#2a2a35] translate-x-1' 
                     : 'text-gray-500 hover:text-gray-300 hover:bg-[#0f0f12] hover:translate-x-1'}
                 `}
               >
                 {({ isActive }) => (
                   <>
                     <span className={`${isActive ? 'text-primary' : 'text-gray-600 group-hover:text-primary'} transition-colors`}>
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

      <div className="p-8 border-t border-[#1e1e24] bg-[#070708]">
        <div className="mb-6 px-4 py-4 bg-[#0a0a0b] rounded-xl border border-[#1e1e24] shadow-sm cursor-default group">
           <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em] leading-none mb-2 font-mono">Permission Protocol</p>
           <p className="text-xs font-black text-gray-400 capitalize group-hover:text-primary transition-colors font-mono">{profile?.role?.toUpperCase()}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-4 w-full text-gray-600 hover:text-primary hover:bg-[#1a1a20] rounded-xl transition-all font-black tracking-widest text-[10px] group uppercase font-mono italic"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          Terminate session
        </button>
      </div>
    </aside>
  );
}
