import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Users, UserPlus, Search, Trash2, GraduationCap, Download, Upload, Filter } from 'lucide-react';
import { CLASSES } from '../constants';

export default function StudentMaster() {
  const [students, setStudents] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', class: '', nis: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from students (Master Data)
      const { data: rawStudents } = await supabase
        .from('students')
        .select('*');
      
      // 2. Fetch from profiles (Siswa accounts)
      const { data: profileSiswa } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'siswa');

      // 3. Fetch active session and all votes
      const { data: session } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();
      
      const { data: votesData } = await supabase
        .from('votes')
        .select('*');

      setActiveSession(session);
      setVotes(votesData || []);

      // Merge results with normalized comparison
      const merged = [
        ...(profileSiswa?.map(s => ({ id: s.uid, name: s.name, class: s.class, isAccount: true, email: s.email, nik: s.nik })) || []),
        ...(rawStudents?.map(s => ({ id: s.id, name: s.name, class: s.class, isAccount: false, nis: s.nis })) || [])
      ].reduce((acc: any[], current: any) => {
        const existing = acc.find(item => 
          item.name.toLowerCase().trim() === current.name.toLowerCase().trim()
        );
        if (!existing) return acc.concat([current]);
        // If account exists, prioritize account info but keep nis if available
        if (current.isAccount) {
          Object.assign(existing, current);
        } else if (current.nis) {
          existing.nis = current.nis;
        }
        return acc;
      }, []);

      setStudents(merged);
    } catch (err: any) {
      console.error(err);
      alert('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').insert([newStudent]);
      if (error) throw error;
      setNewStudent({ name: '', class: '', nis: '' });
      setShowAddModal(false);
      fetchData();
      alert('Data siswa berhasil ditambahkan.');
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data siswa ini?')) return;
    try {
      await supabase.from('students').delete().eq('id', id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (s.nis && s.nis.includes(searchTerm));
    const matchesClass = selectedClass === 'all' || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="space-y-2"
        >
           <div className="flex items-center gap-2">
             <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.3em] flex items-center gap-1.5 font-mono italic">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
               MASTER REGISTRY ACCESS
             </span>
           </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-widest leading-none font-display uppercase italic">Unit <span className="text-primary tracking-tighter">Index</span></h1>
          <p className="text-gray-600 mt-2 font-black text-[10px] uppercase tracking-[0.3em] font-mono leading-none italic">Manage all authorized personnel profiles in core grid.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-8 py-5 primary-gradient text-white font-black rounded-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4 tracking-[0.2em] uppercase font-mono italic group"
          >
            <UserPlus size={18} className="group-hover:translate-x-2 transition-transform" /> 
            Initialize Unit Profile
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2 font-mono italic">
              <Filter size={14} className="text-primary" /> Sector Filter
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <button
                onClick={() => setSelectedClass('all')}
                className={`w-full text-left px-5 py-5 rounded-xl font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-300 font-mono italic border ${
                  selectedClass === 'all' 
                    ? 'bg-primary border-primary text-white shadow-xl translate-x-2' 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-primary/40'
                }`}
              >
                All Personnel
              </button>
              {CLASSES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`w-full text-left px-5 py-5 rounded-xl font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-300 font-mono italic border ${
                    selectedClass === c 
                      ? 'bg-primary border-primary text-white shadow-xl translate-x-2' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-primary/40'
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
            transition={{ delay: 0.1 }}
            className="primary-gradient p-10 rounded-2xl text-white relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] mb-4 font-mono italic opacity-60">Total Population</h3>
            <div className="flex items-baseline gap-3">
              <p className="text-5xl font-black tabular-nums tracking-tighter font-display italic">{filteredStudents.length}</p>
              <p className="text-[10px] font-black opacity-70 uppercase tracking-widest leading-none font-mono">{selectedClass === 'all' ? 'GLOBAL GRID' : selectedClass}</p>
            </div>
          </motion.div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xl flex items-center gap-4 group focus-within:border-primary/50 transition-all duration-300"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="SCAN REGISTRY FOR IDENTIFIER OR NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl outline-none font-black text-[11px] tracking-[0.2em] transition-all placeholder:text-gray-400 font-mono italic shadow-inner focus:bg-white"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[9px] uppercase tracking-[0.3em] font-black border-b border-gray-200 font-mono italic">
                    <th className="px-10 py-6">Registry Identifier</th>
                    <th className="px-10 py-6">NIS Header</th>
                    <th className="px-10 py-6">Sector Placement</th>
                    <th className="px-10 py-6 text-center">Protocol Decision</th>
                    <th className="px-10 py-6 text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={5} className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em] font-mono italic animate-pulse">Scanning Grid Registry...</p>
                      </div>
                    </td></tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr><td colSpan={5} className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <Search size={48} className="text-gray-400" />
                        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em] font-mono italic">Zero records matched search parameters.</p>
                      </div>
                    </td></tr>
                  ) : filteredStudents.map((student, idx) => {
                    const studentVotes = votes.filter(v => v.student_id === student.id);
                    const positiveVotes = studentVotes.filter(v => v.decision === 'naik' || v.decision === 'lulus').length;
                    const negativeVotes = studentVotes.filter(v => v.decision === 'tinggal' || v.decision === 'tidak_lulus').length;
                    const isPassed = positiveVotes > 10;

                    return (
                      <motion.tr 
                        key={student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 + idx * 0.02 }}
                        className="hover:bg-primary/[0.03] transition-all group"
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-primary shadow-inner group-hover:neo-glow-primary transition-all">
                              <Users size={16} />
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 text-[11px] uppercase tracking-widest mb-1 group-hover:text-primary transition-colors font-mono italic">{student.name}</p>
                              {student.isAccount ? (
                                <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-black uppercase tracking-[0.2em] font-mono border border-emerald-500/20">Uplinked</span>
                              ) : (
                                <span className="text-[8px] bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full font-black uppercase tracking-[0.2em] font-mono border border-gray-300">Data Only</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-gray-500 font-black text-[10px] uppercase font-mono tracking-widest">{student.nis || student.nik || '---'}</td>
                        <td className="px-10 py-6">
                          <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest shadow-inner font-mono">{student.class}</span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-[8px] font-black font-mono">
                              <span className="text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 uppercase tracking-widest">Conf: {positiveVotes}</span>
                              <span className="text-rose-600 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20 uppercase tracking-widest">Deny: {negativeVotes}</span>
                            </div>
                            {studentVotes.length > 0 && (
                              <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.3em] shadow-lg font-mono italic ${
                                isPassed ? 'bg-primary text-white neo-glow-primary' : 'bg-gray-50 text-gray-500 border border-gray-200'
                              }`}>
                                {isPassed ? 'VERIFIED_FINAL' : 'PENDING_MATRIX'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => handleDelete(student.id)} 
                            className="p-3 text-gray-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all group-hover:scale-110 border border-transparent hover:border-rose-500/20 shadow-inner"
                            title="Terminal Deletion"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200"
          >
            <div className="primary-gradient p-12 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
               <div className="relative z-10 space-y-2">
                 <h1 className="text-[10px] font-black text-white/80 tracking-[0.4em] uppercase font-mono italic">Sub-Protocol: Initialization</h1>
                 <h3 className="text-3xl font-extrabold tracking-tighter italic font-display uppercase">Register Unit</h3>
                 <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] font-mono leading-none mt-4 italic">Commit profile to core registry</p>
               </div>
            </div>
            <form onSubmit={handleAddStudent} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] pl-1 font-mono italic">Core Identity</label>
                <input 
                  type="text" 
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary/50 text-gray-900 outline-none font-black text-[11px] tracking-widest font-mono placeholder:text-gray-400 transition-all shadow-inner focus:bg-white"
                  placeholder="EX: SYSTEM_NODE_01"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] pl-1 font-mono italic">Primary Serial (NIS)</label>
                <input 
                  type="text" 
                  value={newStudent.nis}
                  onChange={(e) => setNewStudent({...newStudent, nis: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary/50 text-gray-900 outline-none font-black text-[11px] tracking-widest font-mono placeholder:text-gray-400 transition-all shadow-inner focus:bg-white"
                  placeholder="SN-XXXX-XXXX"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] pl-1 font-mono italic">Grid Sector Assignment</label>
                <div className="relative group">
                  <select 
                    value={newStudent.class}
                    onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary/50 text-gray-900 outline-none font-black text-[11px] tracking-widest font-mono transition-all h-[60px] appearance-none cursor-pointer shadow-inner uppercase focus:bg-white"
                    required
                  >
                    <option value="">-- SELECT SECTOR --</option>
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-xl hover:text-gray-900 transition-all uppercase tracking-widest text-[9px] font-mono italic border border-gray-200"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 primary-gradient text-white font-black rounded-xl shadow-xl hover:scale-[1.05] active:scale-[0.95] transition-all uppercase tracking-widest text-[9px] font-mono italic"
                >
                  Synchronize
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
