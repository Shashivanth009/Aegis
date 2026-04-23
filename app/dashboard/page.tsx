'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Users, Search, FolderLock, Plus, Loader2, UserCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [view, setView] = useState<'ledger' | 'personnel'>('ledger');
  const [students, setStudents] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Personnel Creation Form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('EXAMINER');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (view === 'ledger') {
          const res = await fetch('/api/students?query=all');
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setStudents(data.students || []);
        } else {
          const res = await fetch('/api/admin/users');
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setPersonnel(data.personnel || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [view]);

  const handleCreatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg('');
    setError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create personnel');
      
      setCreateMsg('Personnel created and authorized.');
      setNewEmail('');
      setNewPassword('');
      
      // Refresh list
      const freshRes = await fetch('/api/admin/users');
      const freshData = await freshRes.json();
      setPersonnel(freshData.personnel || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePersonnel = async (id: string) => {
    if (!confirm('Are you certain you wish to terminate this clearance?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete personnel');
      setPersonnel(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update clearance level');
      setPersonnel(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStudent = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this student and all their documents? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPersonnel = personnel.filter(p => 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-8 pb-12 font-sans text-[#292524] relative z-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-8 border-b border-[#E5E0D8]">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight text-[#1C1917] mb-2">Cryptographic Ledger</h1>
          <p className="text-[#78716C] font-light text-lg">Institution Administration Protocol</p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex bg-[#EBE6DF] p-1 rounded-2xl">
             <button onClick={() => setView('ledger')} className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors ${view === 'ledger' ? 'bg-[#1C1917] text-[#F9F7F2] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'}`}>Student Ledger</button>
             <button onClick={() => setView('personnel')} className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors ${view === 'personnel' ? 'bg-[#1C1917] text-[#F9F7F2] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'}`}>Personnel</button>
          </div>
          <div className="paper-card px-5 py-3 rounded-2xl flex items-center gap-4 bg-white shadow-sm border border-[#E5E0D8] min-w-[300px]">
             <Search className="w-5 h-5 text-[#A8A29E]" />
             <input 
               type="text" 
               placeholder="Query records..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="bg-transparent border-none outline-none text-[#292524] placeholder:text-[#A8A29E] w-full font-serif font-medium text-lg"
             />
          </div>
        </div>
      </div>

      {error && !creating && (
        <div className="paper-card p-6 border border-[#FCA5A5] bg-[#FEF2F2] flex gap-3 text-sm text-[#991B1B] rounded-2xl shadow-xl max-w-2xl mb-8">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 text-[#DC2626]" /> 
          <div>
            <h3 className="font-bold uppercase tracking-widest text-[10px] mb-1">Clearance Denied / Error</h3>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-[#A8A29E] font-serif text-2xl animate-pulse">Decrypting {view} contents...</div>
      ) : view === 'ledger' ? (
        filteredStudents.length === 0 ? (
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteStudent(s.id, e)}
                        className="p-2 text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors border border-transparent hover:border-[#FCA5A5] z-10 relative"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-[#B45309] group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100 font-bold">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <div className="paper-card p-8 rounded-3xl border border-[#E5E0D8] shadow-sm sticky top-24">
                <h3 className="font-serif text-2xl font-medium text-[#1C1917] mb-6">Provision Access</h3>
                
                {createMsg && (
                   <div className="mb-6 p-4 text-xs font-medium text-green-800 bg-green-100 rounded-xl border border-green-200">
                     {createMsg}
                   </div>
                )}

                <form onSubmit={handleCreatePersonnel} className="space-y-6">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Email Address</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#B45309] transition-colors text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Temporary Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#B45309] transition-colors text-sm" required minLength={6} />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Role Assignment</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#B45309] transition-colors text-sm font-bold text-[#292524]">
                       <option value="EXAMINER">EXAMINER (Terminal Access)</option>
                       <option value="STUDENT">STUDENT (Upload Access)</option>
                    </select>
                  </div>
                  <button type="submit" disabled={creating} className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-[#292524] hover:bg-[#1C1917] text-[#F9F7F2] text-xs uppercase tracking-widest font-bold rounded-xl transition-all disabled:opacity-50">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Issue Clearance</span>
                  </button>
                </form>
             </div>
          </div>
          
          <div className="lg:col-span-2 space-y-4">
             {filteredPersonnel.length === 0 ? (
                <div className="py-20 text-center text-[#A8A29E] font-serif text-xl border border-dashed border-[#E5E0D8] rounded-3xl">No personnel records found.</div>
             ) : (
                filteredPersonnel.map((p) => (
                  <div key={p.id} className="paper-card p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border border-[#E5E0D8] rounded-2xl hover:border-[#D4C5B0] transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${p.role === 'EXAMINER' ? 'bg-green-100 text-green-700' : p.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                           <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="font-bold text-[#1C1917]">{p.email}</h4>
                           <span className="text-xs text-[#A8A29E] mt-1 inline-block bg-[#F9F7F2] px-2 py-0.5 rounded-md font-mono">{p.id}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <select 
                          value={p.role}
                          onChange={(e) => handleUpdateRole(p.id, e.target.value)}
                          className={`text-[10px] tracking-[0.2em] font-bold uppercase py-1.5 px-3 rounded-full border outline-none cursor-pointer appearance-none text-center ${p.role === 'EXAMINER' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : p.role === 'ADMIN' ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'} transition-colors`}
                        >
                          <option value="EXAMINER">EXAMINER</option>
                          <option value="STUDENT">STUDENT</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button onClick={() => handleDeletePersonnel(p.id)} className="p-2 text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors border border-transparent hover:border-[#FCA5A5]" title="Revoke Clearance">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                ))
             )}
          </div>
        </div>
      )}
    </div>
  );
}
