import { UserProfile } from '../App';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, GraduationCap, ClipboardCheck, Calendar, Clock, ArrowRight, AlertCircle, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DashboardProps {
  profile: UserProfile | null;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    activeSessions: 0,
  });
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      if (profile?.role === 'siswa') {
        // Students might see their own graduation status here in the future
        const { data: sessionRes } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('status', 'active')
          .maybeSingle();
        setActiveSession(sessionRes);
      } else {
        // Admin/Guru stats
        const [usersRes, studentsRes, sessionRes, allSessionsRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guru'),
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('voting_sessions').select('*').eq('status', 'active').maybeSingle(),
          supabase.from('voting_sessions').select('*', { count: 'exact', head: true })
        ]);

        if (usersRes.error) throw usersRes.error;
        if (studentsRes.error) throw studentsRes.error;
        
        if (sessionRes.data) setActiveSession(sessionRes.data);

        setStats({
          totalUsers: usersRes.count || 0,
          totalStudents: studentsRes.count || 0,
          activeSessions: allSessionsRes.count || 0
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profile]);

  if (error) {
    return (
      <div className="p-8 bg-red-900/10 border border-red-500/20 rounded-2xl text-red-500">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <AlertCircle size={24} />
          Terjadi Kesalahan
        </h2>
        <p className="text-xs opacity-80 mb-4 font-mono">Gagal memuat data dashboard terminal. Pastikan koneksi grid stabil.</p>
        <pre className="bg-black/50 p-4 rounded-xl text-[10px] overflow-auto max-h-40 font-mono">{error}</pre>
      </div>
    );
  }

  if (profile?.role === 'siswa') {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
             <div className="flex items-center gap-2 mb-3">
               <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-[0.2em] flex items-center gap-1.5 font-mono italic">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                 Authentication Protocol
               </span>
             </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight italic font-display">Halo, <span className="text-primary">{profile?.name || 'Authorized User'}</span>!</h1>
            <p className="text-gray-500 mt-2 font-black text-[10px] uppercase tracking-[0.3em] font-mono leading-none italic">
              Grid Access Synchronization: <span className="text-primary">Secured</span>
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 bg-[#111115] px-6 py-4 rounded-xl shadow-lg border border-[#1e1e24]"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-inner">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] leading-none mb-1 font-mono">Temporal Grid</p>
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest font-mono">
                {format(new Date(), 'dd.MM.yyyy', { locale: id })}
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 relative overflow-hidden group border-[#1e1e24] bg-[#0a0a0b]/40 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-primary/20 transition-colors" />
            
            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-2xl border border-primary/20">
                <GraduationCap size={40} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white tracking-widest uppercase italic font-mono italic">Decision Registry Alpha</h2>
                <p className="text-gray-500 font-mono text-xs leading-relaxed uppercase tracking-[0.2em] italic">
                  Status Kelulusan Anda sedang dalam tahap sinkronisasi data oleh Dewan Guru. Semua metrik penilaian sedang diproses dalam matriks keputusan.
                </p>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="bg-[#111115] p-6 rounded-2xl border border-[#1e1e24] flex-1">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2 font-mono">Current Sector</p>
                  <p className="text-xl font-black text-white font-display tracking-widest">{profile.class}</p>
                </div>
                <div className="bg-[#111115] p-6 rounded-2xl border border-[#1e1e24] flex-1">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2 font-mono">Sync Status</p>
                  <p className="text-xl font-black text-primary font-display tracking-widest italic group-hover:neo-glow-primary">ACTIVE</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Core Personnel', value: stats.totalUsers, icon: <Users size={24} />, color: 'bg-indigo-500', trend: 'Guru & Staff' },
    { label: 'Unit Population', value: stats.totalStudents, icon: <GraduationCap size={24} />, color: 'bg-violet-500', trend: 'Total Siswa' },
    { label: 'Decision Matrix', value: stats.activeSessions, icon: <Vote size={24} />, color: 'bg-emerald-500', trend: 'Total Sesi' },
    { label: 'Temporal Status', value: 'FINAL', icon: <Clock size={24} />, color: 'bg-rose-500', trend: 'Grid Ready' },
  ];

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
           <div className="flex items-center gap-2 mb-3">
             <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.3em] flex items-center gap-1.5 font-mono italic">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
               ADMINISTRATIVE GRID SYNC
             </span>
           </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter italic font-display uppercase">Dashboard <span className="text-primary">Terminal</span></h1>
          <p className="text-gray-500 mt-2 font-black text-[10px] uppercase tracking-[0.2em] font-mono leading-none italic">
            Authorized: <span className="text-white">{profile?.name || 'ROOT'}</span> | Unit: <span className="text-primary">{profile?.role?.toUpperCase() || 'SYS'}</span>
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 bg-[#111115] px-6 py-4 rounded-xl shadow-lg border border-[#1e1e24]"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-inner">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] leading-none mb-1 font-mono">Temporal Grid</p>
            <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest font-mono">
              {format(new Date(), 'dd.MM.yyyy', { locale: id })}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0a0a0b] p-8 rounded-2xl border border-[#1e1e24] shadow-xl hover:border-primary/40 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all"></div>
            <div className={`${card.color} w-14 h-14 rounded-xl text-white shadow-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:neo-glow-primary`}>
              {card.icon}
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-[9px] text-gray-600 font-extrabold uppercase tracking-[0.3em] mb-2 font-mono">{card.label}</p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-black text-white tracking-tighter font-display">{card.value}</p>
                <div className="px-2 py-0.5 bg-[#111115] rounded border border-[#1e1e24]">
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest font-mono italic">{card.trend}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {activeSession && (profile?.role === 'admin' || profile?.role === 'guru') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="primary-gradient p-12 rounded-3xl text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-10">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                <Vote size={48} className="text-white animate-pulse" />
              </div>
              <div className="space-y-3 font-mono italic">
                 <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-[0.3em] backdrop-blur-sm">Voting Protocol: Active</div>
                   <span className="w-2 h-2 bg-primary rounded-full animate-ping shadow-[0_0_10px_#6366f1]"></span>
                 </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase">Initialize Decision Matrix</h2>
                <p className="text-white/70 font-black text-[11px] uppercase tracking-[0.2em]">Session ID: {activeSession?.title} | Target Vector: Kelas {activeSession?.target_grade}</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/app/voting')}
              className="px-10 py-6 bg-white text-primary font-black rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 tracking-[0.2em] font-mono uppercase italic group"
            >
              Analyze Data Matrix
              <ArrowRight size={22} className="group-hover:translate-x-3 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0a0a0b] p-10 rounded-2xl border border-[#1e1e24] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-extrabold mb-8 text-white tracking-widest uppercase italic font-mono flex items-center gap-4">
              <div className="w-1.5 h-6 bg-primary rounded-full transition-all group-hover:scale-y-125"></div> 
              Grid Protocol Guide
            </h2>
            <div className="space-y-8">
               <div className="group/item">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2 group-hover/item:text-primary transition-colors font-mono italic">Decision Invariants</p>
                  <p className="text-xs font-black text-gray-500 leading-relaxed italic font-mono uppercase tracking-widest">Matriks keputusan bersifat final dan tidak dapat diubah setelah sinkronisasi Dewan Guru selesai.</p>
               </div>
               <div className="group/item">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2 group-hover/item:text-primary transition-colors font-mono italic">Security Protocol</p>
                  <p className="text-xs font-black text-gray-500 leading-relaxed italic font-mono uppercase tracking-widest">Akses terminal dibatasi hanya untuk unit yang memiliki otorisasi level G-0 atau lebih tinggi.</p>
               </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0a0a0b] p-10 rounded-2xl border border-[#1e1e24] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-extrabold mb-8 text-white tracking-widest uppercase italic font-mono flex items-center gap-4">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full transition-all group-hover:scale-y-125"></div> 
              Sync Terminal
            </h2>
            <div className="space-y-6">
              <p className="text-xs font-black text-gray-600 uppercase tracking-[0.3em] font-mono leading-none">System Readiness</p>
              <div className="p-8 bg-[#111115] rounded-xl border border-[#1e1e24] transition-all hover:bg-[#1a1a20]">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2 font-mono italic">Support Uplink</p>
                <p className="text-[10px] font-black text-gray-500 leading-relaxed uppercase tracking-widest font-mono">Hubungi root administrator untuk pemulihan unit atau sinkronisasi data master yang terputus.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
