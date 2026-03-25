'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ShieldAlert, Users, Search, FolderLock } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setStudents(data.students || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-12 font-sans text-[#292524] relative z-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#E5E0D8] pb-8">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight text-[#1C1917] mb-2">Cryptographic Ledger</h1>
          <p className="text-[#78716C] font-light text-lg">Institution Administration Protocol</p>
        </div>
        <div className="paper-card px-5 py-3 rounded-2xl flex items-center gap-4 bg-white shadow-sm border border-[#E5E0D8] min-w-[300px]">
           <Search className="w-5 h-5 text-[#A8A29E]" />
           <input 
             type="text" 
             placeholder="Query mathematical record..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="bg-transparent border-none outline-none text-[#292524] placeholder:text-[#A8A29E] w-full font-serif font-medium text-lg"
           />
        </div>
      </div>

      {error ? (
        <div className="paper-card p-6 border border-[#FCA5A5] bg-[#FEF2F2] flex gap-3 text-sm text-[#991B1B] rounded-2xl shadow-xl max-w-2xl">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 text-[#DC2626]" /> 
          <div>
            <h3 className="font-bold uppercase tracking-widest text-[10px] mb-1">Clearance Denied</h3>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-[#A8A29E] font-serif text-2xl animate-pulse">Decrypting ledger contents...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="paper-card py-24 text-center rounded-[3rem] border border-[#E5E0D8] shadow-sm flex flex-col items-center justify-center">
          <Users className="w-16 h-16 text-[#EBE6DF] mb-6 stroke-[1.5]" />
          <h2 className="font-serif text-3xl font-medium text-[#292524] mb-2">No Candidates Found</h2>
          <p className="text-[#78716C] font-light">The cryptographic ledger is completely empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((s) => (
            <Link href={`/verify/student/${s.id}`} key={s.id}>
              <div className="paper-card p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#D4C5B0]/30 border border-[#E5E0D8] group h-full flex flex-col justify-between relative overflow-hidden">
                
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#E2D2B0] rounded-full blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-[#F9F7F2] rounded-2xl flex items-center justify-center border border-[#E5E0D8] group-hover:bg-[#1C1917] transition-colors duration-500">
                       <FolderLock className="w-5 h-5 text-[#B45309] group-hover:text-[#F9F7F2] transition-colors" />
                    </div>
                    <div className="text-[10px] tracking-[0.2em] font-bold uppercase py-1 px-3 rounded-full bg-[#EBE6DF] text-[#78716C]">
                      {s.status}
                    </div>
                  </div>
                  
                  <h3 className="font-serif text-3xl font-medium text-[#1C1917] mb-2 truncate group-hover:text-[#B45309] transition-colors">{s.full_name}</h3>
                  <div className="text-sm font-bold tracking-widest text-[#A8A29E] uppercase font-mono mb-4">{s.roll_number}</div>
                  <div className="text-sm font-light text-[#78716C] italic">{s.exam_name}</div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E5E0D8] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A8A29E] tracking-widest uppercase group-hover:text-[#1C1917] transition-colors">Access Profile</span>
                  <span className="text-[#B45309] group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100 font-bold">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
