import { useState, FormEvent } from 'react';
import { CLASSES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { User as UserIcon, Shield, GraduationCap, ArrowRight, LogOut } from 'lucide-react';
import { isAdmin } from '../config';

interface CompleteProfileProps {
  user: User;
  onComplete: () => Promise<void>;
}

export default function CompleteProfile({ user, onComplete }: CompleteProfileProps) {
  const [name, setName] = useState(user.user_metadata?.full_name || '');
  const [role, setRole] = useState<'guru' | 'siswa'>('siswa');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (role === 'siswa' && !selectedClass) {
      alert('Silakan pilih kelas Anda.');
      return;
    }

    setLoading(true);

    try {
      // Admin is handled automatically by email in App.tsx
      // But if an admin is completing profile, we respect the config
      const finalRole = isAdmin(user.email) ? 'admin' : role;
      const isApproved = finalRole === 'guru' ? false : true;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          uid: user.id,
          name: name,
          email: user.email!,
          role: finalRole,
          class: finalRole === 'siswa' ? selectedClass : null,
          is_approved: isApproved,
          is_pending: false
        }, { onConflict: 'email' });

      if (error) throw error;

      await onComplete();
      navigate('/app');
    } catch (err: any) {
      console.error(err);
      alert('Gagal melengkapi profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-lighter flex items-center justify-center p-6 paw-pattern">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3.5rem] shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="primary-gradient p-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 backdrop-blur-md text-4xl">
            🐾
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Kenalan Meow?</h1>
          <p className="opacity-80 text-sm mt-2 font-medium">Lengkapi profil kucingmu untuk mulai!</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap</label>
            <div className="relative">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold placeholder:text-slate-300 transition-all"
                placeholder="Masukkan nama lengkap Anda"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Pilih Peran Meow</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('siswa')}
                className={`p-6 rounded-[2rem] border-2 transition-all text-center space-y-3 ${
                  role === 'siswa' 
                    ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' 
                    : 'border-slate-50 bg-white text-slate-400 hover:border-slate-100'
                }`}
              >
                <div className="text-3xl">🎒</div>
                <p className="font-extrabold text-sm uppercase tracking-tight">Anak Meow</p>
                <p className="text-[10px] opacity-70 leading-tight font-medium">Bisa langsung masuk & lihat rekap</p>
              </button>
              <button
                type="button"
                onClick={() => setRole('guru')}
                className={`p-6 rounded-[2rem] border-2 transition-all text-center space-y-3 ${
                  role === 'guru' 
                    ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' 
                    : 'border-slate-50 bg-white text-slate-400 hover:border-slate-100'
                }`}
              >
                <div className="text-3xl">👩‍🏫</div>
                <p className="font-extrabold text-sm uppercase tracking-tight">Guru Meow</p>
                <p className="text-[10px] opacity-70 leading-tight font-medium">Butuh konfirmasi Admin</p>
              </button>
            </div>
          </div>

          {role === 'siswa' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-2"
            >
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Pilih Kelas</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark font-bold outline-none appearance-none cursor-pointer"
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </motion.div>
          )}

          <div className="pt-4 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 primary-gradient text-white font-extrabold rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-tight group"
            >
              {loading ? 'Menyimpan...' : 'Mulai Meow!'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-4 text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <LogOut size={16} />
              Batal Meow
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
