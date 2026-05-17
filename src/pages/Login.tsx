import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { isAdmin } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app',
          skipBrowserRedirect: false // Better for mobile to just redirect
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setError(`Auth Error: ${err.message || 'Check connection'}`);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle the frequent 400 error on mobile with a clearer message
        if (error.status === 400) {
           throw new Error('Login Gagal (400): Pastikan waktu di HP Anda akurat (Sync Time) dan cookie tidak diblokir.');
        }
        throw error;
      }

      if (data.user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('uid', data.user.id)
          .single();

        if (!profile) {
          const role = isAdmin(data.user.email) ? 'admin' : 'guru';

          await supabase.from('profiles').insert({
            uid: data.user.id,
            name: data.user.user_metadata?.full_name || 'User',
            email: data.user.email,
            role: role,
            created_at: new Date().toISOString()
          });
        } else {
          // Check if existing profile needs promotion to admin
          if (isAdmin(data.user.email) && profile.role !== 'admin') {
            await supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('uid', data.user.id);
          }
        }
      }
      
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-[#0a0a0b]/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#1e1e24] overflow-hidden relative z-10"
      >
        <div className="primary-gradient p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-sm font-black text-white/60 tracking-[0.4em] uppercase font-mono italic">Access Protocol: EduCore</h1>
            <h2 className="text-4xl font-extrabold tracking-tighter italic font-display uppercase">Initialize Login</h2>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] font-mono leading-none mt-4 italic">Synchronization required for grid entry</p>
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

          <form onSubmit={handleEmailLogin} className="space-y-6">
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
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] pl-1 font-mono italic">Encryption Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-[#111115] border border-[#1e1e24] rounded-xl focus:border-primary/50 text-white outline-none font-black text-[11px] tracking-widest font-mono placeholder:text-gray-800 transition-all shadow-inner"
                  placeholder="••••••••"
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
                  Connect Uplink
                  <LogIn size={18} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e1e24]"></div>
            </div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em] font-mono italic">
              <span className="px-4 bg-[#0a0a0b] text-gray-700">Alternative Bypass</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-8 w-full py-4 bg-[#111115] border border-[#1e1e24] text-gray-400 font-black rounded-xl hover:bg-[#1a1a20] transition-all flex items-center justify-center gap-3 shadow-inner group font-mono text-[10px] uppercase tracking-widest italic"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 grayscale transition-all group-hover:grayscale-0" />
            <span className="group-hover:text-primary transition-colors">Google Uplink</span>
          </button>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] font-mono italic">
              New User?{' '}
              <Link to="/register" className="text-primary hover:text-white transition-all underline decoration-primary/30 underline-offset-4">
                Initialize Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
