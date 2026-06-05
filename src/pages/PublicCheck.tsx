import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Search, GraduationCap, CheckCircle, XCircle, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PublicCheck() {
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Find the student profile by NISN
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('uid, name, role, class, email, nisn')
        .eq('role', 'siswa')
        .eq('nisn', searchTerm.trim())
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        setError('Data siswa tidak ditemukan. Pastikan NISN yang Anda masukkan benar (10 digit).');
        return;
      }

      // 2. Get the latest closed voting session results for this student
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select(`
          decision,
          session_id,
          voting_sessions!inner(status, title)
        `)
        .eq('student_id', profile.uid)
        .eq('voting_sessions.status', 'closed');

      if (votesError) throw votesError;

      if (!votes || votes.length === 0) {
        setResult({
          profile,
          status: 'PENDING',
          message: 'Hasil keputusan belum diumumkan atau sesi voting masih berlangsung.'
        });
      } else {
        // Calculate majority decision (Opsi B: must be strictly > 50% positive to pass)
        const positiveCount = votes.filter((v: any) => ['lulus', 'naik'].includes(v.decision)).length;
        const negativeCount = votes.filter((v: any) => ['tidak_lulus', 'tinggal'].includes(v.decision)).length;

        // Find what type of vote this is based on what exists
        const isGrade12 = votes.some((v: any) => ['lulus', 'tidak_lulus'].includes(v.decision));

        let finalDecision = '';
        if (positiveCount > negativeCount) {
          finalDecision = isGrade12 ? 'lulus' : 'naik';
        } else {
          finalDecision = isGrade12 ? 'tidak_lulus' : 'tinggal';
        }
        
        setResult({
          profile,
          status: finalDecision.toUpperCase(),
          decision: finalDecision
        });
      }
    } catch (err: any) {
      setError('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <button 
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-bold group bg-surface-lighter/50 px-4 py-2 rounded-full border border-border"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Base
        </button>

        <div className="bg-surface rounded-[40px] shadow-2xl overflow-hidden border border-border">
          <div className="bg-primary-gradient p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20 neo-glow">
                <GraduationCap size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tighter uppercase font-mono italic">NeoVision Check</h1>
              <p className="opacity-70 font-medium text-sm tracking-widest uppercase">Cek Hasil Keputusan via NISN</p>
            </div>
          </div>

          <div className="p-10">
            <form onSubmit={handleSearch} className="relative mb-8">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text" 
                placeholder="Masukkan NISN (10 digit)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-14 pr-32 py-5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-lg transition-all text-gray-900 placeholder:text-gray-400 focus:bg-white font-mono"
                maxLength={10}
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-3 top-3 bottom-3 px-6 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all shadow-lg neo-glow disabled:opacity-50 text-sm uppercase tracking-tighter"
              >
                {loading ? 'Verifying...' : 'Validate'}
              </button>
            </form>

            <div className="flex items-center gap-2 mb-8 px-4 opacity-40">
              <div className="h-px bg-border flex-1"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Authentication Result</p>
              <div className="h-px bg-border flex-1"></div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4 text-red-400"
              >
                <AlertCircle size={20} />
                <p className="font-bold text-sm">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                  <div className="grid grid-cols-3 gap-y-6 gap-x-6">
                    <div>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Nama Siswa
                      </p>
                      <p className="font-bold text-lg text-gray-900 font-mono uppercase italic">{result.profile.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">NISN</p>
                      <p className="font-bold text-lg text-gray-900 font-mono">{result.profile.nisn}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Kelas</p>
                      <p className="font-bold text-lg text-gray-900 font-mono">{result.profile.class}</p>
                    </div>
                  </div>
                </div>

                {result.status === 'PENDING' ? (
                  <div className="bg-yellow-50 border border-yellow-200 p-12 rounded-3xl text-center">
                    <Clock size={48} className="mx-auto text-yellow-500 mb-4 animate-pulse" />
                    <p className="text-yellow-700 font-bold text-sm tracking-wide">{result.message}</p>
                  </div>
                ) : (
                  <div className={`p-10 rounded-3xl text-center border-2 overflow-hidden relative group ${
                    result.decision === 'lulus' || result.decision === 'naik' 
                      ? 'bg-green-500/10 border-green-500/50' 
                      : 'bg-red-500/10 border-red-500/50'
                  }`}>
                    {/* Glow effect */}
                    <div className={`absolute inset-0 blur-[60px] opacity-20 ${
                      result.decision === 'lulus' || result.decision === 'naik' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>

                    <div className="relative z-10">
                      {result.decision === 'lulus' || result.decision === 'naik' ? (
                        <CheckCircle size={56} className="mx-auto mb-6 text-green-400" />
                      ) : (
                        <XCircle size={56} className="mx-auto mb-6 text-red-400" />
                      )}
                      <h2 className={`text-5xl font-black mb-2 uppercase tracking-tighter italic font-mono ${
                        result.decision === 'lulus' || result.decision === 'naik' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.decision.replace('_', ' ')}
                      </h2>
                      <p className="font-bold opacity-40 uppercase text-[10px] tracking-[0.3em]">
                        Official Academic Verification
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-center mt-12 text-gray-600 font-bold text-[10px] tracking-widest uppercase">
          &copy; 2026 NEOVISION SECURE PROTOCOL // ACADEMIC AUTHORITY
        </p>
      </motion.div>
    </div>
  );
}
