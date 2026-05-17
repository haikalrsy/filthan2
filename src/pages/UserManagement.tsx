import { useState, useEffect, FormEvent } from 'react';
import { CLASSES } from '../constants';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Users, UserPlus, Search, Trash2, Edit2, Shield, User, Mail, AlertCircle } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'guru' as 'admin' | 'guru' | 'siswa', class: '' });
  const [editingUser, setEditingUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // In Supabase, we can't easily create Auth users from client side without admin key
      // So we insert into profiles table with null uid and wait for them to sign up
      const { error } = await supabase.from('profiles').insert({
        uid: null,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        class: newUser.role === 'siswa' ? newUser.class : null,
        is_pending: true,
        is_approved: newUser.role !== 'guru' // Guru needs approval, others don't by default
      });

      if (error) throw error;

      setNewUser({ name: '', email: '', role: 'guru', class: '' });
      setShowAddModal(false);
      fetchUsers();
      alert('User berhasil ditambahkan sebagai pending.');
    } catch (err: any) {
      console.error(err);
      alert('Gagal menambah user: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      alert('User berhasil dihapus.');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus user: ' + err.message);
    }
  };

  const handleEditUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          class: editingUser.role === 'siswa' ? editingUser.class : null
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      alert('Data user berhasil diperbarui.');
    } catch (err: any) {
      console.error(err);
      alert('Gagal memperbarui user: ' + err.message);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
      alert('User berhasil disetujui.');
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyetujui user: ' + err.message);
    }
  };

  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'guru' | 'siswa'>('all');
  const [classFilter, setClassFilter] = useState('all');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesClass = classFilter === 'all' || u.class === classFilter;
    return matchesSearch && matchesRole && matchesClass;
  });

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
           <div className="flex items-center gap-2 mb-3">
             <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
               Manajemen Pengguna
             </span>
           </div>
          <h1 className="text-4xl font-extrabold text-dark tracking-tight italic">Kelola <span className="text-primary">Akses</span></h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">Atur hak akses dan identitas guru maupun siswa.</p>
        </motion.div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-5 primary-gradient text-white font-extrabold rounded-3xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 tracking-tight group"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          Tambah Pengguna
        </button>
      </div>

      <div className="flex flex-wrap gap-6 items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama atau email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-sm font-bold text-dark outline-none placeholder:text-slate-300 transition-all"
          />
        </div>
        
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-xs font-bold text-slate-600 outline-none transition-all cursor-pointer"
        >
          <option value="all">Semua Peran</option>
          <option value="admin">Administrator</option>
          <option value="guru">Guru / Staff</option>
          <option value="siswa">Siswa</option>
        </select>

        {roleFilter === 'siswa' && (
          <select 
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-xs font-bold text-slate-600 outline-none transition-all cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                <th className="px-8 py-6">Identitas Pengguna</th>
                <th className="px-8 py-6">Peran & Kelas</th>
                <th className="px-8 py-6">Status Akun</th>
                <th className="px-8 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user, idx) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50/30 transition-all group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm border ${
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 
                        user.role === 'guru' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-dark text-sm tracking-tight mb-1">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                          <Mail size={12} className="text-primary" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border w-fit ${
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                        user.role === 'guru' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {user.role === 'admin' ? 'ADMINISTRATOR' : user.role === 'guru' ? 'GURU / STAFF' : 'SISWA'}
                      </span>
                      {user.role === 'siswa' && (
                        <p className="text-[11px] font-bold text-slate-400 pl-1">KEAS: {user.class || 'BELUM DIATUR'}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {!user.is_approved ? (
                      <span className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-bold uppercase tracking-wider">Menunggu Persetujuan</span>
                    ) : user.is_pending ? (
                      <span className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wider">Sinkronisasi...</span>
                    ) : (
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      {!user.is_approved && (
                        <button 
                          onClick={() => handleApproveUser(user.id)}
                          className="px-5 py-2 bg-emerald-500 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-600 transition-all uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                        >
                          Setujui
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                         <Users size={40} />
                       </div>
                       <p className="text-slate-400 font-bold text-sm tracking-tight uppercase italic">Data pengguna tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white"
          >
            <div className="primary-gradient p-10 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
              <h3 className="text-2xl font-extrabold tracking-tight relative z-10 leading-none">Tambah Pengguna Baru</h3>
              <p className="opacity-70 text-xs font-medium mt-3 relative z-10">Daftarkan akun guru, staff, atau siswa ke dalam sistem.</p>
            </div>
            <form onSubmit={handleAddUser} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold placeholder:text-slate-300 transition-all"
                    placeholder="Nama lengkap..."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Pengguna</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold placeholder:text-slate-300 transition-all"
                    placeholder="email@sekolah.sch.id"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tingkat Otoritas</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold transition-all cursor-pointer"
                >
                  <option value="guru">GURU / STAFF</option>
                  <option value="siswa">SISWA</option>
                  <option value="admin">ADMINISTRATOR</option>
                </select>
              </div>

              {newUser.role === 'siswa' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Alokasi Kelas</label>
                  <select 
                    value={newUser.class}
                    onChange={(e) => setNewUser({...newUser, class: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- PILIH KELAS --</option>
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </motion.div>
              )}

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 text-slate-400 font-bold bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 primary-gradient text-white font-extrabold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Simpan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white"
          >
             <div className="primary-gradient p-10 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
              <h3 className="text-2xl font-extrabold tracking-tight relative z-10 leading-none">Ubah Data Pengguna</h3>
              <p className="opacity-70 text-xs font-medium mt-3 relative z-10">Perbarui metadata dan profil identitas pengguna.</p>
            </div>
            <form onSubmit={handleEditUser} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nama Identitas</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold placeholder:text-slate-300 transition-all"
                    placeholder="Nama terbaru..."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Pemulihan</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold placeholder:text-slate-300 transition-all"
                    placeholder="email@baru.sys"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Level Otoritas Baru</label>
                <select 
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold transition-all cursor-pointer"
                >
                  <option value="guru">GURU / STAFF</option>
                  <option value="siswa">SISWA</option>
                  <option value="admin">ADMINISTRATOR</option>
                </select>
              </div>

              {editingUser.role === 'siswa' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Relokasi Sektor Kelas</label>
                  <select 
                    value={editingUser.class || ''}
                    onChange={(e) => setEditingUser({...editingUser, class: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- PILIH KELAS --</option>
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </motion.div>
              )}

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 py-4 text-slate-400 font-bold bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 primary-gradient text-white font-extrabold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
