import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, Clock, Users, Database, GraduationCap, Play, StopCircle, ShieldCheck, Award } from 'lucide-react';
import { format } from 'date-fns';
import { CLASSES, getGrade } from '../constants';

export default function Voting({ profile }: { profile: any }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<any[]>([]);
  const [allVotes, setAllVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [targetGrade, setTargetGrade] = useState<number>(10);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedStudentVotes, setSelectedStudentVotes] = useState<any>(null);

  const [isStarting, setIsStarting] = useState(false);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Fetch sessions error:', error);
        return;
      }
      
      setSessions(data || []);
      
      const active = data?.find(s => s.status === 'active');
      if (active) setActiveSession(active);
    } catch (err) {
      console.error('System error:', err);
    }
  };

  const fetchStudentsAndVotes = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      // 1. Fetch from profiles (users with accounts)
      const { data: profileSiswa } = await supabase
        .from('profiles')
        .select('uid, name, class, email')
        .eq('role', 'siswa')
        .eq('class', selectedClass);
      
      // 2. Fetch from students (master data)
      const { data: rawStudents } = await supabase
        .from('students')
        .select('id, name, class, nis')
        .eq('class', selectedClass);
      
      // Merge results
      const merged = [
        ...(profileSiswa?.map(s => ({ id: s.uid, name: s.name, class: s.class, isAccount: true, email: s.email })) || []),
        ...(rawStudents?.map(s => ({ id: s.id, name: s.name, class: s.class, isAccount: false, nis: s.nis })) || [])
      ].reduce((acc: any[], current) => {
        const x = acc.find(item => item.name.toLowerCase() === current.name.toLowerCase());
        if (!x) return acc.concat([current]);
        return acc;
      }, []);

      setStudents(merged);

      if (activeSession) {
        // Fetch user's own votes
        const { data: userVotesData } = await supabase
          .from('votes')
          .select('*')
          .eq('session_id', activeSession.id)
          .eq('voter_id', profile.uid);
        setUserVotes(userVotesData || []);

        // Fetch ALL votes for consensus (Admins and Gurus need this)
        if (profile.role === 'admin' || profile.role === 'guru') {
          const { data: allVotesData, error: allVotesError } = await supabase
            .from('votes')
            .select('*') // Fetching without join first to ensure we get data
            .eq('session_id', activeSession.id);
          
          if (allVotesError) {
            console.error('All votes fetch error:', allVotesError);
          } else {
            setAllVotes(allVotesData || []);
            
            // Optionally fetch profile names separately if needed, 
            // but for consensus calculation we just need the raw votes
            if (allVotesData && allVotesData.length > 0) {
              const voterIds = [...new Set(allVotesData.map(v => v.voter_id))];
              const { data: profileNames } = await supabase
                .from('profiles')
                .select('uid, name')
                .in('uid', voterIds);
              
              if (profileNames) {
                setAllVotes(allVotesData.map(v => ({
                  ...v,
                  profiles: profileNames.find(p => p.uid === v.voter_id)
                })));
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndVotes();
    } else {
      setStudents([]);
    }
  }, [selectedClass, activeSession, targetGrade]);

  // Reset class when target grade changes and no active session
  useEffect(() => {
    if (!activeSession) {
      setSelectedClass('');
      setStudents([]);
    } else {
      // If there is an active session, ensure we are targeting its grade
      setTargetGrade(activeSession.target_grade);
    }
  }, [targetGrade, activeSession?.id]);

  const filteredClasses = CLASSES.filter(c => getGrade(c) === (activeSession?.target_grade || targetGrade));

  // Auto-select first class
  useEffect(() => {
    if (filteredClasses.length > 0 && !selectedClass) {
      setSelectedClass(filteredClasses[0]);
    }
  }, [filteredClasses, selectedClass]);

  const handleStartSession = async () => {
    if (!newSessionTitle.trim()) {
      alert('Harap masukkan judul sesi voting!');
      return;
    }
    
    setIsStarting(true);
    try {
      const { error } = await supabase.from('voting_sessions').insert({
        title: newSessionTitle,
        target_grade: targetGrade,
        created_by: profile.uid,
        status: 'active'
      });
      
      if (error) {
        if (error.message.includes('not found')) {
          throw new Error('Tabel voting_sessions tidak ditemukan. Pastikan Anda sudah menjalankan SQL setup di Supabase.');
        }
        throw error;
      }
      
      setNewSessionTitle('');
      setShowSessionModal(false);
      await fetchSessions();
      alert('Sesi voting berhasil dimulai!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal memulai sesi: ' + err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('voting_sessions')
        .update({ status: 'closed' })
        .eq('id', sessionId);
      if (error) throw error;
      setActiveSession(null);
      fetchSessions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVote = async (studentId: string, decision: string) => {
    if (!activeSession) return;
    
    // 1. Optimistic Update for User's own vote
    const newVote = {
      session_id: activeSession.id,
      student_id: studentId,
      voter_id: profile.uid,
      decision: decision,
      created_at: new Date().toISOString()
    };

    setUserVotes(prev => {
      const filtered = prev.filter(v => String(v.student_id) !== String(studentId));
      return [...filtered, newVote];
    });

    // 2. Optimistic Update for All Votes (Consensus)
    if (profile.role === 'admin' || profile.role === 'guru') {
      setAllVotes(prev => {
        const filtered = prev.filter(v => 
          !(String(v.student_id) === String(studentId) && String(v.voter_id) === String(profile.uid))
        );
        return [...filtered, { ...newVote, profiles: { name: profile.name } }];
      });
    }

    try {
      const { error } = await supabase.from('votes').upsert({
        session_id: activeSession.id,
        student_id: studentId,
        voter_id: profile.uid,
        decision: decision
      }, { onConflict: 'session_id,student_id,voter_id' });
      
      if (error) throw error;
      
      // Delay fetch slightly to allow DB to propagate if needed, 
      // although optimistic update already handled the UI
      setTimeout(() => {
        fetchStudentsAndVotes();
      }, 500);
    } catch (err: any) {
      alert('Gagal mengirim voting: ' + err.message);
      // Revert on error
      fetchStudentsAndVotes();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
           <div className="flex items-center gap-2 mb-3">
             <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
               {activeSession ? 'Sesi Voting Aktif' : 'Protokol Keputusan'}
             </span>
           </div>
          <h1 className="text-4xl font-extrabold text-dark tracking-tight leading-none">
            {activeSession?.target_grade === 12 ? 'Kelulusan' : 'Kenaikan'} <span className="text-primary italic">Siswa</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            {activeSession 
              ? `Sedang berlangsung: ${activeSession.title} (Kelas ${activeSession.target_grade})` 
              : 'Silakan aktifkan sesi voting untuk memulai pengambilan keputusan.'}
          </p>
        </motion.div>

        {profile?.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            {!activeSession ? (
              <button 
                onClick={() => setShowSessionModal(true)}
                className="px-8 py-4 primary-gradient text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-tight group"
              >
                <Play size={20} className="group-hover:translate-x-1 transition-transform" />
                Buka Sesi Voting
              </button>
            ) : (
              <button 
                onClick={() => handleCloseSession(activeSession.id)}
                className="flex items-center gap-2 px-8 py-4 bg-rose-50 text-rose-500 font-bold rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all text-sm"
              >
                <StopCircle size={18} />
                Tutup Sesi
              </button>
            )}
          </motion.div>
        )}
      </div>

      {!activeSession && profile?.role !== 'admin' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-16 rounded-[3rem] text-center shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/10">
              <Clock className="text-primary" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-dark tracking-tight">Sesi Belum Tersedia</h2>
            <p className="text-slate-400 mt-2 font-medium max-w-sm mx-auto leading-relaxed">
              Tim administrasi belum membuka sesi voting untuk periode ini. Harap tunggu instruksi lebih lanjut.
            </p>
          </div>
        </motion.div>
      )}

      {(activeSession || profile?.role === 'admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {!activeSession && profile?.role === 'admin' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
              >
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Pilih Tingkat</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 11, 12].map(g => (
                    <button
                      key={g}
                      onClick={() => setTargetGrade(g)}
                      className={`py-3 rounded-2xl font-bold text-sm transition-all duration-300 border ${
                        targetGrade === g 
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20'
                      }`}
                    >
                      Kls {g}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
            >
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Filter Kelas</h3>
              <div className="space-y-2">
                {filteredClasses.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Tidak ada kelas.</p>
                ) : filteredClasses.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-xs transition-all duration-300 border ${
                      selectedClass === c 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 translate-x-1' 
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-primary hover:border-primary/20 hover:bg-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="primary-gradient p-10 rounded-[2.5rem] text-white overflow-hidden relative group shadow-xl"
            >
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
              <Database size={40} className="mb-6 opacity-30" />
              <h3 className="font-bold text-lg mb-4 border-b border-white/20 pb-2">Status Sistem</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Tingkatan Target</p>
                  <p className="font-extrabold text-2xl">Kelas {activeSession?.target_grade || targetGrade}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Status Sesi</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${activeSession ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                    <p className="font-extrabold text-lg uppercase">{activeSession?.status || 'Siaga'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-dark leading-none">Manifest Siswa</h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium italic">Menampilkan daftar siswa kelas {selectedClass || '...'}</p>
                </div>
                <button 
                  onClick={() => fetchStudentsAndVotes()}
                  className="px-4 py-2 bg-white border border-slate-100 shadow-sm rounded-xl text-[10px] font-bold text-slate-500 hover:text-primary hover:border-primary/20 transition-all uppercase tracking-widest flex items-center gap-2 group"
                >
                  <Clock size={12} className="group-hover:rotate-180 transition-transform duration-700" />
                  Segarkan Data
                </button>
              </div>
              
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-white border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                      <th className="px-8 py-5">Informasi Siswa</th>
                      <th className="px-8 py-5">Statistik Voting</th>
                      <th className="px-8 py-5 text-center">Tindakan Anda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading && selectedClass ? (
                      <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold text-sm animate-pulse italic">Mensinkronisasi matriks data...</td></tr>
                    ) : students.length === 0 ? (
                      <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold text-sm italic">Matriks kosong. Silakan pilih kelas di panel kiri.</td></tr>
                    ) : students.map((student, idx) => {
                      const myVote = userVotes.find(v => String(v.student_id) === String(student.id));
                      const isGrade12 = (activeSession?.target_grade || targetGrade) === 12;
                      
                      const studentVotes = allVotes.filter(v => 
                        String(v.student_id).toLowerCase() === String(student.id).toLowerCase()
                      );
                      const positiveCount = studentVotes.filter(v => ['naik', 'lulus'].includes(v.decision)).length;
                      const negativeCount = studentVotes.filter(v => ['tinggal', 'tidak_lulus'].includes(v.decision)).length;
                      
                      const totalVotes = positiveCount + negativeCount;
                      const consensus = totalVotes > 0 ? Math.round((positiveCount / totalVotes) * 100) : 0;
                      const isAutoApproved = positiveCount >= 10;

                      return (
                        <motion.tr 
                          key={student.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + idx * 0.03 }}
                          className={`group transition-all ${isAutoApproved ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm border-2 transition-all group-hover:scale-110 ${
                                isAutoApproved ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-700 text-sm tracking-tight mb-1 group-hover:text-primary transition-colors">{student.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-medium italic">{student.nis || 'Tanpa NIS'}</span>
                                  {isAutoApproved && (
                                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                                      <ShieldCheck size={10} /> Auto-Lulus
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3 text-[10px] font-bold mb-1">
                                <div className="flex gap-3">
                                  <span className="text-emerald-500">+{positiveCount}</span>
                                  <span className="text-rose-400">-{negativeCount}</span>
                                </div>
                                <span className="text-slate-400 font-mono">{consensus}%</span>
                              </div>
                              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${consensus}%` }}
                                  className={`h-full transition-all duration-1000 ${
                                    consensus > 70 ? 'bg-emerald-400' : consensus > 40 ? 'bg-amber-400' : 'bg-rose-400'
                                  }`}
                                ></motion.div>
                              </div>
                              {(profile?.role === 'admin' || profile?.role === 'guru') && studentVotes.length > 0 && (
                                <button 
                                  onClick={() => setSelectedStudentVotes({ student, votes: studentVotes })}
                                  className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 opacity-60 hover:opacity-100 transition-all"
                                >
                                  <Users size={10} /> Lihat Rincian Saksi ({studentVotes.length})
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-2">
                              {isGrade12 ? (
                                <>
                                  <button
                                    onClick={() => handleVote(student.id, 'lulus')}
                                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
                                      myVote?.decision === 'lulus' 
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-200'
                                    }`}
                                  >
                                    <CheckCircle size={14} /> LULUS
                                  </button>
                                  <button
                                    onClick={() => handleVote(student.id, 'tidak_lulus')}
                                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
                                      myVote?.decision === 'tidak_lulus' 
                                        ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                                    }`}
                                  >
                                    <XCircle size={14} /> TIDAK
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleVote(student.id, 'naik')}
                                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
                                      myVote?.decision === 'naik' 
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-200'
                                    }`}
                                  >
                                    <CheckCircle size={14} /> NAIK
                                  </button>
                                  <button
                                    onClick={() => handleVote(student.id, 'tinggal')}
                                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
                                      myVote?.decision === 'tinggal' 
                                        ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                                    }`}
                                  >
                                    <XCircle size={14} /> TINGGAL
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white"
          >
            <div className="primary-gradient p-12 text-white relative overflow-hidden text-center">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <h3 className="text-2xl font-bold tracking-tight relative z-10 leading-none">Otoritas Keputusan</h3>
              <p className="text-white/70 text-sm mt-3 relative z-10">Mulai sesi validasi identitas dan status akademik.</p>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Judul Protokol Sesi</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Rapat Pleno Semester Genap"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-lg focus:shadow-primary/5 text-dark outline-none font-bold placeholder:text-slate-300 transition-all font-mono italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tingkat Target</label>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 11, 12].map(grade => (
                    <button
                      key={grade}
                      onClick={() => setTargetGrade(grade)}
                      className={`py-4 rounded-2xl font-extrabold text-sm transition-all duration-300 border ${
                        targetGrade === grade 
                          ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:text-primary'
                      }`}
                    >
                      Kls {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowSessionModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 font-bold rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-100 transition-all"
                >
                  Batalkan
                </button>
                <button 
                  onClick={handleStartSession}
                  disabled={isStarting}
                  className="flex-1 py-4 primary-gradient text-white font-extrabold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isStarting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Play size={16} /> Aktifkan
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {selectedStudentVotes && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white"
          >
            <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Rincian Transparansi Saksi</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedStudentVotes.student.name}</h3>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelas</p>
                  <p className="text-lg font-bold text-primary italic">{selectedStudentVotes.student.class}</p>
               </div>
            </div>
            
            <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {selectedStudentVotes.votes.map((v: any, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 shadow-sm group-hover:bg-primary/5 group-hover:text-primary transition-all">
                        {v.profiles?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{v.profiles?.name || 'Saksi Anonim'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Laporan diproses pada {format(new Date(v.created_at), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-tight shadow-sm ${
                      ['naik', 'lulus'].includes(v.decision)
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-rose-500 text-white'
                    }`}>
                      {v.decision === 'naik' ? 'SETUJU NAIK' : v.decision === 'lulus' ? 'SETUJU LULUS' : 'KEBERATAN'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedStudentVotes(null)}
                className="px-10 py-3.5 bg-white text-slate-500 font-bold rounded-2xl border border-slate-100 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all text-xs"
              >
                Tutup Matriks
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
