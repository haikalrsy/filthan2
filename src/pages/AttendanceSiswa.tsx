import { useState, useEffect } from 'react';
import { CLASSES } from '../constants';
import { UserProfile } from '../App';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Users, Calendar, Search } from 'lucide-react';

interface AttendanceSiswaProps {
  profile: UserProfile | null;
}

export default function AttendanceSiswa({ profile }: AttendanceSiswaProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('11 RPL 2');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from profiles (users with accounts)
      const { data: profileSiswa } = await supabase
        .from('profiles')
        .select('uid, name, class')
        .eq('role', 'siswa')
        .eq('class', selectedClass);
      
      // 2. Fetch from students (raw student data)
      const { data: rawStudents } = await supabase
        .from('students')
        .select('id, name, class, nis')
        .eq('class', selectedClass);
      
      // Merge results with normalized comparison
      const merged = [
        ...(profileSiswa?.map(s => ({ id: s.uid, name: s.name, class: s.class, isUser: true })) || []),
        ...(rawStudents?.map(s => ({ id: s.id, name: s.name, class: s.class, isUser: false, nis: s.nis })) || [])
      ].reduce((acc: any[], current) => {
        const x = acc.find(item => item.name.toLowerCase().trim() === current.name.toLowerCase().trim());
        if (!x) return acc.concat([current]);
        return acc;
      }, []);

      setStudents(merged);

      // Fetch attendances for selected date and class
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendances')
        .select('*')
        .eq('date', selectedDate)
        .eq('type', 'siswa');
      
      if (attendanceError) throw attendanceError;
      setAttendances(attendanceData || []);
    } catch (err: any) {
      console.error(err);
      alert('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, selectedDate]);

  const handleAttendance = async (student: any, status: 'hadir' | 'izin' | 'sakit' | 'alfa') => {
    if (!profile) return;
    
    try {
      // Check if already attended today
      const existing = attendances.find(a => a.user_id === student.id);
      
      if (existing) {
        if (existing.status === status) return; // No change
        
        const { error } = await supabase
          .from('attendances')
          .update({ status: status })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendances').insert({
          user_id: student.id,
          user_name: student.name,
          type: 'siswa',
          status: status,
          date: selectedDate,
          recorded_by: profile.uid
        });
        if (error) throw error;
      }
      
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Gagal mencatat absensi: ' + err.message);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
             <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
               🐾 Daftar Anak Meow
             </span>
           </div>
          <h1 className="text-4xl font-extrabold text-dark tracking-tight">Absensi <span className="text-primary italic">Anak Bulu</span></h1>
          <p className="text-slate-500 font-medium text-sm">Catat kehadiran para meow dengan penuh kasih sayang.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white px-6 py-3 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-primary/50 transition-all cursor-pointer">
            <Users className="text-primary group-hover:scale-110 transition-transform" size={20} />
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-sm font-bold text-dark outline-none border-none bg-transparent cursor-pointer"
            >
              {CLASSES.map(c => (
                <option key={c} value={c} className="bg-white text-dark">{c}</option>
              ))}
            </select>
          </div>
          <div className="bg-white px-6 py-3 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-primary/50 transition-all cursor-pointer">
            <Calendar className="text-primary group-hover:scale-110 transition-transform" size={20} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-bold text-dark outline-none border-none bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/40 backdrop-blur-sm">
          <h2 className="text-xl font-extrabold text-dark tracking-tight">Daftar Meow - <span className="text-primary italic">{selectedClass}</span> 🐱</h2>
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama kucing kesayangan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 text-dark outline-none font-bold placeholder:text-slate-300 transition-all transition-duration-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100">
                <th className="px-10 py-5">Identitas Meow</th>
                <th className="px-10 py-5">Status Kehadiran</th>
                <th className="px-10 py-5 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-4xl animate-bounce">😺</div>
                      <p className="text-slate-400 font-bold text-sm italic animate-pulse">Memanggil para meow...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.map((student) => {
                const attendance = attendances.find(a => a.user_id === student.id);
                return (
                  <tr key={student.id} className="hover:bg-primary/[0.02] transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform bg-gradient-to-br from-slate-50 to-slate-100">
                          {student.isUser ? '🐈' : '🐾'}
                        </div>
                        <div>
                          <p className="font-extrabold text-dark text-lg tracking-tight group-hover:text-primary transition-colors">{student.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {student.isUser ? (
                              <span className="text-[9px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Digital Meow</span>
                            ) : (
                              <span className="text-[9px] bg-secondary/20 text-secondary-dark px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Static Record {student.nis ? `#${student.nis}` : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-3">
                        {['hadir', 'izin', 'sakit', 'alfa'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleAttendance(student, status as any)}
                            className={`px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all border-2 ${
                              attendance?.status === status
                                ? status === 'hadir' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' :
                                  status === 'izin' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' :
                                  'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-primary hover:text-primary'
                            }`}
                          >
                            {status === 'hadir' ? 'Hadir 🐾' : status}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      {!attendance ? (
                        <button 
                          onClick={() => handleAttendance(student, 'hadir')}
                          className="px-5 py-2.5 bg-primary text-white text-[10px] font-bold rounded-2xl uppercase tracking-wider hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                        >
                          Catat Hadir
                        </button>
                      ) : (
                        <span className="px-5 py-2.5 bg-emerald-50 text-emerald-500 text-[10px] font-bold rounded-2xl uppercase tracking-wider border border-emerald-100 italic">
                          Sudah Dicatat ✅
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-5xl">😿</div>
                      <p className="text-slate-400 font-bold text-sm italic">Wah, tidak ada meow di sini...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
