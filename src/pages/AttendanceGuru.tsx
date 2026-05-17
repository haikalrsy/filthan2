import { useState, useEffect, FormEvent } from 'react';
import { UserProfile } from '../App';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AttendanceGuruProps {
  profile: UserProfile | null;
}

export default function AttendanceGuru({ profile }: AttendanceGuruProps) {
  const [status, setStatus] = useState<'hadir' | 'izin' | 'sakit' | 'alfa'>('hadir');
  const [loading, setLoading] = useState(false);
  const [alreadyAbsen, setAlreadyAbsen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const checkAttendance = async () => {
      if (!profile) return;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: snap } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', profile.uid)
        .eq('date', today)
        .eq('type', 'guru');

      if (snap && snap.length > 0) {
        setAlreadyAbsen(true);
      }

      const { data: historySnap } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', profile.uid)
        .order('created_at', { ascending: false })
        .limit(5);

      if (historySnap) {
        setHistory(historySnap);
      }
    };

    checkAttendance();
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) {
      alert('Profil tidak ditemukan. Silakan login ulang.');
      return;
    }
    
    if (!profile.uid) {
      alert('ID User tidak ditemukan. Pastikan profil Anda sudah terhubung dengan benar.');
      return;
    }

    if (alreadyAbsen) {
      alert('Anda sudah melakukan konfirmasi kehadiran hari ini.');
      return;
    }

    setLoading(true);
    try {
      console.log('Mengirim kehadiran untuk:', profile.uid);
      const { error } = await supabase.from('attendances').insert({
        user_id: profile.uid,
        user_name: profile.name,
        type: 'guru',
        status: status,
        date: format(new Date(), 'yyyy-MM-dd'),
        recorded_by: profile.uid
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setAlreadyAbsen(true);
      alert('Data kehadiran berhasil dikirim!');
      
      // Refresh history
      const { data: historySnap, error: historyError } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', profile.uid)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (historyError) console.error('Error fetching history:', historyError);
      if (historySnap) setHistory(historySnap);
    } catch (err: any) {
      console.error('Catch error:', err);
      alert('Gagal mengirim data kehadiran: ' + (err.message || 'Terjadi kesalahan tidak diketahui'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center">
         <div className="flex items-center justify-center gap-2 mb-2">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Authority Validation Terminal</span>
         </div>
        <h1 className="text-4xl font-black text-white italic font-mono uppercase tracking-tighter">Identity Confirmation</h1>
        <p className="text-gray-500 mt-2 font-bold text-xs uppercase tracking-[0.15em]">Log your physical presence into the academic matrix.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-surface p-10 rounded-[40px] shadow-sm border border-border relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          {alreadyAbsen ? (
            <div className="text-center py-10 relative z-10">
              <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-[32px] border border-green-500/20 flex items-center justify-center mx-auto mb-8 neo-glow">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl font-black text-white italic font-mono uppercase tracking-tighter mb-2">Authenticated</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">System protocol confirms your identity validation for today.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.2em] pl-1">Validation State Selector</label>
                <div className="grid grid-cols-2 gap-4">
                  {['hadir', 'izin', 'sakit', 'alfa'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s as any)}
                      className={`
                        py-5 px-6 rounded-2xl font-black uppercase transition-all border italic font-mono text-xs tracking-tighter
                        ${status === s 
                          ? 'bg-primary/10 border-primary text-primary shadow-lg neo-glow' 
                          : 'bg-dark border-border text-gray-600 hover:text-white hover:border-gray-700'}
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-dark/50 rounded-3xl flex items-center gap-6 border border-border group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 text-primary">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Grid Sync Time</p>
                  <p className="text-2xl font-black text-white italic font-mono tracking-tighter uppercase">{format(new Date(), 'HH:mm:ss')} Z</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-sm neo-glow group"
              >
                {loading ? 'MODULATING...' : 'COMMIT VALIDATION'}
                <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </form>
          )}
        </motion.div>

        {/* History Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-surface p-10 rounded-[40px] shadow-sm border border-border"
        >
          <div className="flex items-center gap-3 mb-8">
             <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
             <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic font-mono">
               Recent Validation Logs
             </h2>
          </div>
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="p-6 bg-dark/50 rounded-3xl border border-border flex items-center justify-between group hover:bg-surface-lighter transition-all">
                <div>
                  <p className="font-bold text-white text-sm font-mono tracking-tight uppercase italic">{format(new Date(item.date), 'dd.MM/yyyy')}</p>
                  <p className="text-[10px] text-gray-500 font-mono tracking-tighter mt-1 italic">{format(new Date(item.created_at), 'HH:mm:ss')} Z-SYNC</p>
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic font-mono ${
                  item.status === 'hadir' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                  item.status === 'izin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                  'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-20 text-gray-600">
                <div className="w-16 h-16 bg-dark rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                  <AlertCircle size={32} className="opacity-20" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">Registry empty. No logs found.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
