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
import { Shield, BookOpen, GraduationCap, AlertTriangle, ExternalLink, Lock, RefreshCw } from 'lucide-react';

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
  is_approved: boolean;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-[#0a0a0b]/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#1e1e24] p-12 text-center space-y-8 relative z-10"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-2xl">
            <AlertTriangle size={40} className="text-amber-500" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-sm font-black text-white/60 tracking-[0.4em] uppercase font-mono italic">Configuration Required</h1>
            <h2 className="text-3xl font-extrabold text-white tracking-widest uppercase italic font-display">Grid Link Offline</h2>
            <p className="text-xs font-black text-gray-500 leading-relaxed uppercase tracking-[0.2em] font-mono italic">
              Terminal ini memerlukan sinkronisasi dengan Supabase Cloud. Silakan atur variabel lingkungan di menu Pengaturan.
            </p>
          </div>

          <div className="bg-[#111115] p-6 rounded-xl border border-[#1e1e24] text-left space-y-4">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] font-mono italic">Setup Protocol:</p>
            <ol className="text-[10px] font-black text-gray-400 space-y-3 font-mono uppercase tracking-widest">
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
    // Check active sessions and subscribe to auth changes
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user);
        }
      } catch (err) {
        console.error('Error in getSession check:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`uid.eq.${currentUser.id},email.eq.${currentUser.email}`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        // If profile exists but UID is null (pending user), link it
        if (!data.uid) {
          const { data: linkedProfile, error: linkError } = await supabase
            .from('profiles')
            .update({ uid: currentUser.id, is_pending: false })
            .eq('id', data.id)
            .select()
            .single();
          
          if (linkedProfile) {
            setProfile(linkedProfile as UserProfile);
            return;
          }
          if (linkError) console.error('Error linking profile:', linkError);
        }

        // Check if existing profile needs promotion to admin
        if (isAdmin(currentUser.email) && data.role !== 'admin') {
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
        }
        setProfile(data as UserProfile);
      } else {
        // If user exists in Auth but not in profiles table, we don't auto-create anymore
        // We let them complete profile unless they are admin
        if (isAdmin(currentUser.email)) {
          const newProfile = {
            uid: currentUser.id,
            name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Admin',
            email: currentUser.email!,
            role: 'admin' as const,
            is_approved: true,
            created_at: new Date().toISOString()
          };

          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createdProfile) {
            setProfile(createdProfile as UserProfile);
          } else {
            if (insertError) console.error('Error creating admin profile:', insertError);
            setProfile(newProfile as UserProfile);
          }
        } else {
          // Non-admin with no profile -> set profile to null to trigger CompleteProfile
          setProfile(null);
        }
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      // Ultimate fallback
      setProfile({
        uid: currentUser.id,
        name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
        email: currentUser.email || '',
        role: isAdmin(currentUser.email) ? 'admin' : 'guru'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] p-6 relative overflow-hidden">
        {/* Background Grid & Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
        </div>
        
        <div className="relative z-10 text-center space-y-8 max-w-sm w-full">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-[#0a0a0b]/80 rounded-2xl flex items-center justify-center mx-auto border border-[#1e1e24] shadow-2xl relative group"
          >
            <RefreshCw size={36} className="text-primary animate-spin" />
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase italic font-display">
              NEO<span className="text-primary tracking-tighter">VISION</span>
            </h1>
            <p className="text-[10px] font-black text-primary/80 uppercase tracking-[0.4em] animate-pulse font-mono block">
              INITIALIZING PROTOCOL MATRIX...
            </p>
          </div>

          <div className="w-48 h-1 bg-[#111115] rounded-full mx-auto overflow-hidden border border-[#1e1e24]">
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
              profile?.role ? <Navigate to="/app" /> : <CompleteProfile user={user} onComplete={() => fetchProfile(user)} />
            ) : (
              <Navigate to="/login" />
            )
          } 
          
        />

        <Route path="/app" element={
          user ? (
            !profile?.role ? (
              <Navigate to="/complete-profile" />
            ) : !profile.is_approved ? (
              <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                  <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                </div>
                
                <div className="max-w-md w-full bg-[#0a0a0b]/80 backdrop-blur-2xl p-12 rounded-3xl border border-[#1e1e24] shadow-2xl text-center space-y-8 relative z-10">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-2xl">
                    <Lock size={32} className="text-amber-500 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-xs font-black text-white/60 tracking-[0.4em] uppercase font-mono italic">Security Status</h1>
                    <h2 className="text-2xl font-extrabold text-white uppercase italic tracking-wider">Otorisasi Tertunda</h2>
                    <p className="text-[11px] font-black leading-relaxed text-gray-500 uppercase tracking-widest font-mono italic">
                      Profil Anda sedang diverifikasi oleh administrator sistem NeoVision. Harap tunggu hingga sesi Anda diaktifkan secara resmi.
                    </p>
                  </div>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="w-full py-5 bg-[#111115] text-red-500 hover:bg-red-950/20 font-black rounded-xl hover:text-red-400 transition-all uppercase tracking-widest text-[10px] border border-red-500/20 active:scale-95 font-mono"
                  >
                    Abort Session (Keluar)
                  </button>
                </div>
              </div>
            ) : (
              <Layout profile={profile} />
            )
          ) : (
            <Navigate to="/login" />
          )
        }>
          <Route index element={<Dashboard profile={profile} />} />
          <Route path="voting" element={<Voting profile={profile} />} />
          <Route path="student-master" element={profile?.role === 'admin' ? <StudentMaster /> : <Navigate to="/app" />} />
          <Route path="users" element={profile?.role === 'admin' ? <UserManagement /> : <Navigate to="/app" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
