import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, AlertCircle, User } from 'lucide-react';
import { isAdmin } from '../config';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. Create profile in database
        const role = isAdmin(email) ? 'admin' : 'guru';
        
        const { error: profileError } = await supabase.from('profiles').insert({
          uid: data.user.id,
          name: name,
          email: email,
          role: role,
          created_at: new Date().toISOString()
        });

        if (profileError) throw profileError;
        
        // Success!
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-[#0a0a0b]/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#1e1e24] overflow-hidden relative z-10"
      >
        <div className="primary-gradient p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-sm font-black text-white/60 tracking-[0.4em] uppercase font-mono italic">Account Creation Protocol</h1>
            <h2 className="text-4xl font-extrabold tracking-tighter italic font-display uppercase text-white">Initialize Unit</h2>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] font-mono leading-none mt-4 italic">Registry enrollment in progress</p>
          </div>
        </div>

        <div className="p-10">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 bg-rose-500/10 text-rose-500 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 font-mono italic"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] pl-1 font-mono italic">Full Designation</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-[#111115] border border-[#1e1e24] rounded-xl focus:border-primary/50 text-white outline-none font-black text-[11px] tracking-widest font-mono placeholder:text-gray-800 transition-all shadow-inner"
                  placeholder="IDENTIFIER NAME"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] pl-1 font-mono italic">System Identifier</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-[#111115] border border-[#1e1e24] rounded-xl focus:border-primary/50 text-white outline-none font-black text-[11px] tracking-widest font-mono placeholder:text-gray-800 transition-all shadow-inner"
                  placeholder="USER@EDUCORE.SYS"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] pl-1 font-mono italic">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-[#111115] border border-[#1e1e24] rounded-xl focus:border-primary/50 text-white outline-none font-black text-[11px] tracking-widest font-mono placeholder:text-gray-800 transition-all shadow-inner"
                  placeholder="MIN 6 CHARS"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 primary-gradient text-white font-black rounded-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 tracking-widest group font-mono uppercase italic"
            >
              {loading ? (
                 <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  Finalize Enrollment
                  <UserPlus size={18} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] font-mono italic">
              Existing Unit?{' '}
              <Link to="/login" className="text-primary hover:text-white transition-all underline decoration-primary/30 underline-offset-4">
                Access Terminal
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
