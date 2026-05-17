import { useState, useEffect } from 'react';
import { CLASSES } from '../constants';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';
import { ClipboardList, Calendar, Search, Download, Filter, Users, GraduationCap } from 'lucide-react';

export default function Recap({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState<'guru' | 'siswa'>('siswa');
  const [attendances, setAttendances] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedClass, setSelectedClass] = useState('11 RPL 2');

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(new Date(selectedMonth));
      const end = endOfMonth(new Date(selectedMonth));
      
      const [attendanceRes, usersRes, studentsRes] = await Promise.all([
        supabase
          .from('attendances')
          .select('*')
          .gte('date', format(start, 'yyyy-MM-dd'))
          .lte('date', format(end, 'yyyy-MM-dd'))
          .eq('type', activeTab),
        supabase.from('profiles').select('*').eq('role', 'guru'),
        supabase.from('profiles').select('*').eq('role', 'siswa').eq('class', selectedClass)
      ]);

      if (attendanceRes.data) setAttendances(attendanceRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (studentsRes.data) setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedMonth, selectedClass]);

  const currentList = activeTab === 'guru' ? users : students;
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(new Date(selectedMonth)),
    end: endOfMonth(new Date(selectedMonth))
  });

  const handleDownload = () => {
    if (attendances.length === 0) {
      alert('Belum ada data absensi untuk bulan ini.');
      return;
    }

    try {
      // Prepare CSV data
      const headers = ['Nama', 'Tipe', ...daysInMonth.map(day => format(day, 'dd/MM'))];
      const rows = currentList.map(person => {
        const rowData: any = {
          'Nama': person.name,
          'Tipe': activeTab === 'guru' ? 'Guru/Staff' : person.class
        };
        
        daysInMonth.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const attendance = attendances.find(a => a.user_id === person.uid && a.date === dateStr);
          rowData[format(day, 'dd/MM')] = attendance ? attendance.status.charAt(0).toUpperCase() : '-';
        });
        
        return rowData;
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => headers.map(h => `"${row[h] || '-'}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Rekapitulasi_Kehadiran_${activeTab}_${selectedMonth}_${activeTab === 'siswa' ? selectedClass : ''}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Gagal mengunduh rekap.');
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-3">
             <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.3em] flex items-center gap-1.5 font-mono italic">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
               DATA RECOVERY PROTOCOL
             </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-widest italic font-display uppercase">Laporan <span className="text-primary tracking-tighter">Matriks</span></h1>
          <p className="text-gray-500 mt-2 font-black text-[10px] uppercase tracking-[0.3em] font-mono leading-none italic">Bypass standard view: <span className="text-white">Enabled</span></p>
        </motion.div>
        
        <div className="flex flex-wrap items-center gap-4">
          {activeTab === 'siswa' && (
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/30 transition-all">
              <Users className="text-primary transition-transform group-hover:scale-110" size={18} />
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-bold text-slate-700 outline-none border-none bg-transparent cursor-pointer"
              >
                {CLASSES.map(c => (
                  <option key={c} value={c} className="text-dark">{c}</option>
                ))}
              </select>
            </div>
          )}
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/30 transition-all">
            <Calendar className="text-primary transition-transform group-hover:scale-110" size={18} />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-700 outline-none border-none bg-transparent cursor-pointer"
            />
          </div>
          <button 
            onClick={handleDownload}
            className="p-4 bg-white text-slate-400 rounded-2xl border border-slate-100 shadow-sm hover:text-primary hover:bg-primary/5 hover:border-primary transition-all group"
            title="Unduh Rekap (CSV)"
          >
            <Download size={22} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex p-1.5 bg-[#0a0a0b] border border-[#1e1e24] rounded-xl w-full sm:w-[28rem] shadow-inner">
        <button 
          onClick={() => setActiveTab('siswa')}
          className={`flex-1 py-4 rounded-lg font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 font-mono italic ${activeTab === 'siswa' ? 'bg-[#1a1a20] text-primary shadow-2xl border border-[#2a2a35]' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <GraduationCap size={16} />
          Sektor Siswa
        </button>
        <button 
          onClick={() => setActiveTab('guru')}
          className={`flex-1 py-4 rounded-lg font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 font-mono italic ${activeTab === 'guru' ? 'bg-[#1a1a20] text-primary shadow-2xl border border-[#2a2a35]' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <Users size={16} />
          Sektor Guru
        </button>
      </div>

      <div className="bg-[#0a0a0b] rounded-3xl shadow-2xl border border-[#1e1e24] overflow-hidden relative group">
        <div className="p-8 border-b border-[#1e1e24] flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary shadow-inner">
              <ClipboardList size={22} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white tracking-widest uppercase italic font-mono">Registry Grid: <span className="text-primary">{activeTab === 'guru' ? 'Guru' : 'Siswa'}</span></h2>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] font-mono leading-none">Status: Live Access</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Hadir (H)</span>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Izin (I)</span>
            </div>
            <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider">Alfa (A)</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111115] text-gray-600 text-[9px] uppercase tracking-[0.3em] font-black font-mono italic">
                <th className="px-10 py-6 sticky left-0 bg-[#0a0a0b] z-20 border-r border-[#1e1e24] min-w-[260px] shadow-xl">Grid Identifier</th>
                {daysInMonth.map(day => (
                  <th key={day.toString()} className="px-4 py-6 text-center border-r border-[#1e1e24] min-w-[60px] font-mono text-primary">
                    {format(day, 'dd')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e24]">
              {currentList.map((person, pIdx) => (
                <motion.tr 
                  key={person.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pIdx * 0.05 }}
                  className="hover:bg-[#111115] transition-all group/row"
                >
                  <td className="px-10 py-6 sticky left-0 bg-[#0a0a0b] z-10 border-r border-[#1e1e24] group-hover/row:bg-[#111115] transition-colors shadow-xl">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-white text-xs tracking-widest uppercase mb-1 font-mono italic group-hover/row:text-primary transition-colors">{person.name}</span>
                      <span className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em] font-mono leading-none">{activeTab === 'guru' ? 'STAFF UNIT' : 'SECTOR ' + person.class}</span>
                    </div>
                  </td>
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const attendance = attendances.find(a => a.user_id === person.uid && a.date === dateStr);
                    
                    let statusChar = '-';
                    let statusClass = 'text-slate-200';
                    let bgClass = '';
                    
                    if (attendance) {
                      statusChar = attendance.status.charAt(0).toUpperCase();
                      if (attendance.status === 'hadir') {
                        statusClass = 'text-emerald-500 font-black';
                        bgClass = 'bg-emerald-50/20';
                      } else if (attendance.status === 'izin') {
                        statusClass = 'text-amber-500 font-black';
                        bgClass = 'bg-amber-50/20';
                      } else {
                        statusClass = 'text-rose-500 font-black';
                        bgClass = 'bg-rose-50/20';
                      }
                    }

                    return (
                      <td key={day.toString()} className={`px-4 py-5 text-center border-r border-slate-50 text-[11px] font-mono ${statusClass} ${bgClass} transition-colors`}>
                        {statusChar}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
              {currentList.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth.length + 1} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 shadow-inner">
                        <Search size={36} />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 italic">Data rekap tidak ditemukan</p>
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
