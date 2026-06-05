/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { isAdmin } from './config';
import { Shield, BookOpen, GraduationCap, AlertTriangle, ExternalLink, Lock, RefreshCw, Hash } from 'lucide-react';

// Pages
import Landing from './pages/Landing';
import PublicCheck from './pages/PublicCheck';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Voting from './pages/Voting';
import UserManagement from './pages/UserManagement';
import StudentMaster from './pages/StudentMaster';

import CompleteProfile from './pages/CompleteProfile';

// Components
import Layout from './components/Layout';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'guru' | 'siswa';
  class?: string;
  nisn?: string;
  is_approved: boolean;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nisnInput, setNisnInput] = useState('');
  const [nisnLoading, setNisnLoading] = useState(false);

  const handleNisnSubmit = async () => {
    if (!nisnInput.trim() || nisnInput.trim().length !== 10) {
      alert('NISN harus terdiri dari 10 digit.');
      return;
    }
    if (!user || !profile) return;
    setNisnLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nisn: nisnInput.trim() })
        .eq('uid', user.id);
      if (error) throw error;
      // Re-fetch profile to update state
      await fetchProfile(user);
    } catch (err: any) {
      alert('Gagal menyimpan NISN: ' + err.message);
    } finally {
      setNisnLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200 p-12 text-center space-y-8 relative z-10"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-2xl">
            <AlertTriangle size={40} className="text-amber-500" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-sm font-black text-gray-500 tracking-[0.4em] uppercase font-mono italic">Configuration Required</h1>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-widest uppercase italic font-display">Grid Link Offline</h2>
            <p className="text-xs font-black text-gray-500 leading-relaxed uppercase tracking-[0.2em] font-mono italic">
              Terminal ini memerlukan sinkronisasi dengan Supabase Cloud. Silakan atur variabel lingkungan di menu Pengaturan.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-left space-y-4">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] font-mono italic">Setup Protocol:</p>
            <ol className="text-[10px] font-black text-gray-500 space-y-3 font-mono uppercase tracking-widest">
              <li className="flex gap-3"><span className="text-primary">01.</span> Register at supabase.com</li>
              <li className="flex gap-3"><span className="text-primary">02.</span> Open App Settings &gt; Secrets</li>
              <li className="flex gap-3"><span className="text-primary">03.</span> Define VITE_SUPABASE_URL</li>
              <li className="flex gap-3"><span className="text-primary">04.</span> Define VITE_SUPABASE_ANON_KEY</li>
            </ol>
          </div>

          <a 
            href="https://supabase.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-5 primary-gradient text-white font-black rounded-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 tracking-widest uppercase font-mono italic"
          >
            Access Supabase Cloud
            <ExternalLink size={18} />
          </a>
        </motion.div>
      </div>
    );
  }

  useEffect(() => {
    // Use onAuthStateChange as the SINGLE source of truth (Supabase recommended pattern).
    // Do NOT use getSession() separately — it causes race conditions with OAuth callbacks.
    
    // Check if we're in the middle of an OAuth callback (URL has code param)
    const isOAuthCallback = window.location.search.includes('code=') || 
                            window.location.hash.includes('access_token');
    
    if (isOAuthCallback) {
      console.log('[Auth] OAuth callback detected, waiting for code exchange...');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event, '| Has session:', !!session, '| Email:', session?.user?.email);
      
      try {
        if (event === 'INITIAL_SESSION') {
          // This fires first on page load. If session exists, user is already logged in.
          if (session) {
            setUser(session.user);
            await fetchProfile(session.user);
          }
          // Only stop loading here if we're NOT waiting for an OAuth callback
          if (!isOAuthCallback || session) {
            setLoading(false);
          }
        } else if (event === 'SIGNED_IN') {
          // This fires after successful login (including OAuth code exchange)
          if (session) {
            setUser(session.user);
            await fetchProfile(session.user);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          if (session) {
            setUser(session.user);
            // Don't re-fetch profile on token refresh, just update user
          }
        } else {
          // Any other event (PASSWORD_RECOVERY, USER_UPDATED, etc.)
          if (session) {
            setUser(session.user);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Error handling event:', event, err);
        // If we have a session user, try to at least set user
        if (session?.user) {
          setUser(session.user);
          // For admin, guarantee they get in even if fetchProfile throws
          if (isAdmin(session.user.email)) {
            setProfile({
              uid: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin',
              email: session.user.email || '',
              role: 'admin',
              is_approved: true,
            });
          }
        }
        setLoading(false);
      }
    });

    // Safety timeout: if loading is still true after 8 seconds, force stop
    // This prevents infinite loading screen if something goes wrong
    const safetyTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('[Auth] Safety timeout triggered — forcing loading to false');
          return false;
        }
        return prev;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Helper to build a guaranteed admin profile object
  const buildAdminProfile = (currentUser: User): UserProfile => ({
    uid: currentUser.id,
    name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Admin',
    email: currentUser.email || '',
    role: 'admin',
    is_approved: true,
  });

  const fetchProfile = async (currentUser: User) => {
    const userIsAdmin = isAdmin(currentUser.email);
    console.log('[fetchProfile] email:', currentUser.email, '| isAdmin:', userIsAdmin);

    try {
      // Wrap query with a timeout to prevent hanging forever
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .or(`uid.eq.${currentUser.id},email.eq.${currentUser.email}`)
        .maybeSingle();
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timed out after 5s')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      console.log('[fetchProfile] Query completed. data:', !!data, 'error:', error);

      if (error) {
        console.error('Error fetching profile:', error);
        // If query itself failed and user is admin, guarantee they get in
        if (userIsAdmin) {
          console.log('[fetchProfile] Query failed but user is admin, using fallback profile');
          setProfile(buildAdminProfile(currentUser));
          return;
        }
      }

      if (data) {
        console.log('[fetchProfile] Found existing profile:', data.role, 'uid:', data.uid, 'is_approved:', data.is_approved);
        
        // If profile exists but UID is null (pending user), link it
        if (!data.uid) {
          const { data: linkedProfile, error: linkError } = await supabase
            .from('profiles')
            .update({ 
              uid: currentUser.id, 
              is_pending: false,
              // If admin, also promote during linking
              ...(userIsAdmin ? { role: 'admin', is_approved: true } : {})
            })
            .eq('id', data.id)
            .select()
            .single();
          
          if (linkedProfile) {
            setProfile(linkedProfile as UserProfile);
            return;
          }
          if (linkError) console.error('Error linking profile:', linkError);
          // If linking failed but user is admin, use fallback
          if (userIsAdmin) {
            setProfile(buildAdminProfile(currentUser));
            return;
          }
        }

        // Check if existing profile needs promotion to admin
        if (userIsAdmin && data.role !== 'admin') {
          console.log('[fetchProfile] Promoting user to admin...');
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', is_approved: true })
            .eq('uid', currentUser.id)
            .select()
            .single();
          
          if (updatedProfile) {
            setProfile(updatedProfile as UserProfile);
            return;
          }
          if (updateError) console.error('Error promoting to admin:', updateError);
          // Even if DB update fails, force admin profile in memory
          setProfile(buildAdminProfile(currentUser));
          return;
        }

        // If admin but is_approved is somehow false, fix it
        if (userIsAdmin && !data.is_approved) {
          const profileData = { ...data, role: 'admin' as const, is_approved: true };
          setProfile(profileData as UserProfile);
          // Also try to fix in DB (fire and forget)
          supabase.from('profiles').update({ is_approved: true, role: 'admin' }).eq('uid', currentUser.id);
          return;
        }

        setProfile(data as UserProfile);
      } else {
        console.log('[fetchProfile] No profile found in DB');
        // If user exists in Auth but not in profiles table
        if (userIsAdmin) {
          console.log('[fetchProfile] Auto-creating admin profile...');
          const adminProfile = buildAdminProfile(currentUser);
          const newProfileData = {
            ...adminProfile,
            created_at: new Date().toISOString()
          };

          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfileData)
            .select()
            .single();

          if (createdProfile) {
            console.log('[fetchProfile] Admin profile created successfully');
            setProfile(createdProfile as UserProfile);
          } else {
            console.error('Error creating admin profile:', insertError);
            // DB insert failed? Still let admin in with in-memory profile
            setProfile(adminProfile);
          }
        } else {
          // Non-admin with no profile -> set profile to null to trigger CompleteProfile
          setProfile(null);
        }
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      // Ultimate fallback - admin ALWAYS gets in
      if (userIsAdmin) {
        setProfile(buildAdminProfile(currentUser));
      } else {
        // Don't overwrite a valid profile that was already fetched successfully
        // (e.g. from a prior auth event). Only set null if no profile exists yet.
        setProfile(prev => {
          if (prev && prev.uid === currentUser.id) {
            console.log('[fetchProfile] Keeping existing valid profile on error');
            return prev;
          }
          // No profile yet — set null to trigger CompleteProfile
          return null;
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
        {/* Background Grid & Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
        </div>
        
        <div className="relative z-10 text-center space-y-8 max-w-sm w-full">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center mx-auto border border-gray-200 shadow-xl relative group"
          >
            <RefreshCw size={36} className="text-primary animate-spin" />
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-widest uppercase italic font-display">
              NEO<span className="text-primary tracking-tighter">VISION</span>
            </h1>
            <p className="text-[10px] font-black text-primary/80 uppercase tracking-[0.4em] animate-pulse font-mono block">
              INITIALIZING PROTOCOL MATRIX...
            </p>
          </div>

          <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden border border-gray-300">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-1/2 h-full bg-primary rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/cek-hasil" element={<PublicCheck />} />
        <Route path="/login" element={user ? <Navigate to="/app" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/app" /> : <Register />} />
        
        <Route 
          path="/complete-profile" 
          element={
            user ? (
              (profile?.role || isAdmin(user.email)) ? <Navigate to="/app" /> : <CompleteProfile user={user} onComplete={() => fetchProfile(user)} />
            ) : (
              <Navigate to="/login" />
            )
          } 
          
        />

        <Route path="/app" element={
          user ? (
            (!profile?.role && !isAdmin(user.email)) ? (
              <Navigate to="/complete-profile" />
            ) : (!profile?.is_approved && profile?.role === 'guru' && !isAdmin(user.email)) ? (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                  <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                </div>
                
                <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl p-12 rounded-3xl border border-gray-200 shadow-xl text-center space-y-8 relative z-10">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-2xl">
                    <Lock size={32} className="text-amber-500 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-xs font-black text-gray-500 tracking-[0.4em] uppercase font-mono italic">Security Status</h1>
                    <h2 className="text-2xl font-extrabold text-gray-900 uppercase italic tracking-wider">Otorisasi Tertunda</h2>
                    <p className="text-[11px] font-black leading-relaxed text-gray-500 uppercase tracking-widest font-mono italic">
                      Profil Anda sedang diverifikasi oleh administrator sistem NeoVision. Harap tunggu hingga sesi Anda diaktifkan secara resmi.
                    </p>
                  </div>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="w-full py-5 bg-gray-50 text-red-500 hover:bg-red-50 font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-red-500/20 active:scale-95 font-mono"
                  >
                    Abort Session (Keluar)
                  </button>
                </div>
              </div>
            ) : (profile?.role === 'siswa' && !profile?.nisn) ? (
              /* NISN Completion Screen — for existing siswa accounts without NISN */
              <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                  <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full bg-white/80 backdrop-blur-2xl p-12 rounded-3xl border border-gray-200 shadow-xl space-y-8 relative z-10"
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-lg">
                      <Hash size={32} className="text-primary" />
                    </div>
                    <h1 className="text-xs font-black text-gray-500 tracking-[0.4em] uppercase font-mono italic">Data Wajib</h1>
                    <h2 className="text-2xl font-extrabold text-gray-900 uppercase italic tracking-wider">Lengkapi NISN</h2>
                    <p className="text-[11px] font-black leading-relaxed text-gray-500 uppercase tracking-widest font-mono italic">
                      NISN (Nomor Induk Siswa Nasional) diperlukan untuk mengakses sistem. Masukkan 10 digit NISN Anda.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">NISN</label>
                    <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        value={nisnInput}
                        onChange={(e) => setNisnInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none font-bold placeholder:text-gray-400 focus:border-primary transition-all font-mono focus:bg-white text-lg"
                        placeholder="10 DIGIT NISN"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono pl-1 uppercase tracking-widest">
                      {nisnInput.length}/10 digit
                    </p>
                  </div>

                  <button 
                    onClick={handleNisnSubmit}
                    disabled={nisnLoading || nisnInput.length !== 10}
                    className="w-full py-5 primary-gradient text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-widest uppercase font-mono italic disabled:opacity-50"
                  >
                    {nisnLoading ? 'MENYIMPAN...' : 'SIMPAN NISN'}
                  </button>

                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="w-full py-4 text-gray-500 hover:text-red-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-mono"
                  >
                    Keluar
                  </button>
                </motion.div>
              </div>
            ) : (
              <Layout profile={profile || {uid: user.id, name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin', email: user.email || '', role: 'admin', is_approved: true}} />
            )
          ) : (
            <Navigate to="/login" />
          )
        }>
          <Route index element={<Dashboard profile={profile} />} />
          <Route path="voting" element={<Voting profile={profile} />} />
          <Route path="student-master" element={(profile?.role === 'admin' || isAdmin(user?.email)) ? <StudentMaster /> : <Navigate to="/app" />} />
          <Route path="users" element={(profile?.role === 'admin' || isAdmin(user?.email)) ? <UserManagement /> : <Navigate to="/app" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
