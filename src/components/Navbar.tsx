import { LogOut, Bell, Search, Menu } from 'lucide-react';
import { UserProfile } from '../App';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  profile: UserProfile | null;
  onMenuClick?: () => void;
}

export default function Navbar({ profile, onMenuClick }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 md:hidden">
        <button onClick={onMenuClick} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm font-mono italic">N</div>
           <h1 className="text-sm font-extrabold text-gray-900 tracking-widest font-mono italic">NEOVISION</h1>
        </div>
      </div>

      <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-xl px-5 py-2.5 w-96 group focus-within:border-primary/50 transition-all duration-300">
        <Search size={16} className="text-gray-500 group-focus-within:text-primary transition-colors mr-3" />
        <input 
          type="text" 
          placeholder="System query..." 
          className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-[0.2em] w-full text-gray-900 placeholder:text-gray-400 font-mono italic"
        />
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button className="p-2.5 text-gray-500 hover:text-primary transition-all relative group">
          <Bell size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
        </button>

        <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-black text-gray-900 tracking-widest uppercase font-mono italic leading-none mb-1">{profile?.name || 'User'}</p>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] opacity-80 font-mono">
              {profile?.role === 'siswa' && profile?.nisn ? `NISN: ${profile.nisn}` : `ID: ${profile?.role || 'Guest'}`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-primary font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer font-mono">
            {profile?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
