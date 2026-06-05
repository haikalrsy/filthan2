import { useState, FormEvent } from 'react';
import { CLASSES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { User as UserIcon, Shield, GraduationCap, ArrowRight, LogOut, Hash } from 'lucide-react';
import { isAdmin } from '../config';

interface CompleteProfileProps {
  user: User;
  onComplete: () => Promise<void>;
}

export default function CompleteProfile({ user, onComplete }: CompleteProfileProps) {
  const [name, setName] = useState(user.user_metadata?.full_name || '');
  const [role, setRole] = useState<'guru' | 'siswa'>('siswa');
  const [selectedClass, setSelectedClass] = useState('');
  const [nisn, setNisn] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (role === 'siswa' && !selectedClass) {
      alert('Silakan pilih kelas Anda.');
      return;
    }

    if (role === 'siswa' && !nisn.trim()) {
      alert('NISN wajib diisi untuk siswa.');
      return;
    }

    if (role === 'siswa' && nisn.trim().length !== 10) {
      alert('NISN harus terdiri dari 10 digit.');
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
          nisn: finalRole === 'siswa' ? nisn.trim() : null,
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-gray-200/50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-3xl border border-gray-200 shadow-xl overflow-hidden relative z-10"
      >
        <div className="p-10 border-b border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-lg">
            <UserIcon size={32} className="text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-widest uppercase italic font-mono">Lengkapi Profil</h1>
            <p className="text-[10px] text-gray-500 font-extrabold tracking-widest uppercase mt-1 font-mono">Daftarkan Kredensial Akademik Anda</p>
            <p className="text-[10px] text-primary/80 font-bold tracking-widest uppercase mt-2 font-mono">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">Nama Lengkap</label>
            <div className="relative">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none font-bold placeholder:text-gray-400 focus:border-primary transition-all font-mono focus:bg-white"
                placeholder="NAMA LENGKAP"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">Pilih Otoritas Peran</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('siswa')}
                className={`p-6 rounded-2xl border transition-all text-center space-y-4 ${
                  role === 'siswa' 
                    ? 'border-primary bg-primary/10 text-gray-900 shadow-lg' 
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mx-auto border border-primary/25">
                  <GraduationCap size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wider font-mono">Siswa (Student)</p>
                  <p className="text-[9px] text-gray-500 uppercase mt-1 leading-tight font-mono">Melihat rekap & pengumuman</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('guru')}
                className={`p-6 rounded-2xl border transition-all text-center space-y-4 ${
                  role === 'guru' 
                    ? 'border-indigo-500 bg-indigo-500/10 text-gray-900 shadow-lg' 
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center mx-auto border border-indigo-500/25">
                  <Shield size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wider font-mono">Guru (Teacher)</p>
                  <p className="text-[9px] text-gray-500 uppercase mt-1 leading-tight font-mono">Akses input nilai & voting</p>
                </div>
              </button>
            </div>
          </div>

          {isAdmin(user.email) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 mt-4 border border-amber-500/30 bg-amber-500/10 rounded-xl"
            >
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest font-mono text-center">
                Sistem mendeteksi Anda sebagai Admin. Klik "CONCLUDE" untuk masuk.
              </p>
            </motion.div>
          )}

          {role === 'siswa' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">NISN (Nomor Induk Siswa Nasional)</label>
                <div className="relative">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none font-bold placeholder:text-gray-400 focus:border-primary transition-all font-mono focus:bg-white"
                    placeholder="10 DIGIT NISN"
                    required
                    maxLength={10}
                  />
                </div>
                <p className="text-[9px] text-gray-400 font-mono pl-1 uppercase tracking-widest">
                  {nisn.length}/10 digit — NISN digunakan untuk pencarian hasil keputusan
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">Pilih Kelas</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl font-bold outline-none appearance-none cursor-pointer font-mono focus:bg-white"
                  required
                >
                  <option value="">-- PILIH KELAS --</option>
                  {CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          <div className="pt-4 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 primary-gradient text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-widest uppercase font-mono italic"
            >
              {loading ? 'MENYIMPAN...' : 'CONCLUDE MATRIX REGISTRATION'}
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-4 text-gray-500 hover:text-red-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-mono"
            >
              <LogOut size={14} />
              Batal & Keluar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
