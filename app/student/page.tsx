'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ShieldCheck, CheckCircle2, FileWarning, QrCode, GraduationCap, Loader2 } from 'lucide-react';
import Image from 'next/image';

const REQUIRED_DOCS = ['AADHAAR', 'SSC_MEMO', 'HALLTICKET'];
const DOC_LABELS: Record<string, string> = {
  AADHAAR: 'Government Aadhaar (e-Aadhaar)',
  SSC_MEMO: 'SSC Memorandum of Marks',
  HALLTICKET: 'Examination Hall Ticket'
};

export default function StudentPortal() {
  const [student, setStudent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile init state
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [examName, setExamName] = useState('');
  const [initLoading, setInitLoading] = useState(false);
  
  // Upload state
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  const supabase = createSupabaseBrowserClient();

  const loadData = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      
      if (data.students && data.students.length > 0) {
        const s = data.students[0];
        setStudent(s);
        
        const { data: d } = await supabase.from('student_documents').select('*').eq('student_id', s.id);
        if (d) setDocuments(d);

        if (d && d.length === REQUIRED_DOCS.length) {
          const qrRes = await fetch(`/api/students/${s.id}/qr`);
          const { dataUrl } = await qrRes.json();
          setQrCode(dataUrl);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleInitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, roll_number: rollNumber, exam_name: examName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadData();
    } catch (err: any) {
      setError(err.message);
      setInitLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    setUploading(docType);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    try {
      const res = await fetch(`/api/students/${student.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await loadData();
    } catch (err: any) {
      setError(`[${docType}] ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2] text-[#78716C] animate-pulse font-serif text-xl">Loading secure terminal...</div>;

  if (!student) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] font-sans text-[#292524] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <div className="w-20 h-20 bg-[#EBE6DF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <GraduationCap className="w-10 h-10 text-[#B45309] stroke-[1.5]" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-center text-[#1C1917] mb-2 tracking-tight">Initialize Profile</h1>
          <p className="text-[#78716C] font-light text-center leading-relaxed mb-10">
            Establish your identity to begin the cryptographic verification sequence.
          </p>

          <form onSubmit={handleInitProfile} className="paper-card p-10 rounded-[2.5rem] space-y-6 shadow-2xl">
            {error && (
              <div className="p-4 bg-[#FEF2F2] text-[#991B1B] text-xs font-medium rounded-xl border border-[#FCA5A5]">{error}</div>
            )}
            
            <div>
              <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Full Legal Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:ring-1 focus:ring-[#B45309] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Roll Number</label>
              <input type="text" required value={rollNumber} onChange={e => setRollNumber(e.target.value)} className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:ring-1 focus:ring-[#B45309] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Examination Name</label>
              <select required value={examName} onChange={e => setExamName(e.target.value)} className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:ring-1 focus:ring-[#B45309] focus:outline-none appearance-none">
                <option value="">Select Examination</option>
                <option value="Final Semester 2026">Final Semester 2026</option>
                <option value="Entrance Exam 2026">Entrance Exam 2026</option>
              </select>
            </div>

            <button disabled={initLoading} type="submit" className="w-full py-4 bg-[#292524] hover:bg-[#1C1917] text-[#F9F7F2] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all disabled:opacity-50 mt-4 flex justify-center">
              {initLoading ? <span className="animate-pulse">Registering...</span> : 'Establish Identity'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-sans text-[#292524] py-12 px-4 sm:px-6 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#E2D2B0] blur-[120px] mix-blend-multiply opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col md:flex-row gap-12 mt-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1"
        >
          <div className="mb-12">
            <h1 className="font-serif text-4xl sm:text-6xl font-medium text-[#1C1917] mb-4 tracking-tight leading-none">{student.full_name}</h1>
            <div className="flex items-center gap-4 text-[#57534E] font-light tracking-wide text-lg">
              <span>{student.roll_number}</span>
              <span className="w-1.5 h-1.5 bg-[#D4C5B0] rounded-full" />
              <span>{student.exam_name}</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A8A29E] border-b border-[#E5E0D8] pb-4">Required Cryptographic Proofs</h2>
            
            {error && (
              <div className="paper-card p-4 border border-[#FCA5A5] bg-[#FEF2F2] flex gap-3 text-sm text-[#991B1B] rounded-2xl items-start shadow-xl">
                <FileWarning className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#DC2626]" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {REQUIRED_DOCS.map(docType => {
              const uploadedDoc = documents.find(d => d.document_type === docType);
              
              return (
                <div key={docType} className={`p-6 rounded-3xl transition-all duration-500 shadow-sm ${uploadedDoc ? 'bg-[#FFFFFF] border border-[#E5E0D8]' : 'bg-[#EBE6DF] border border-transparent opacity-80'}`}>
                  <div className="flex justify-between items-center md:flex-row flex-col gap-4">
                    <div className="w-full md:w-auto">
                      <h3 className="font-serif text-xl md:text-2xl font-medium text-[#292524] mb-2">{DOC_LABELS[docType]}</h3>
                      {uploadedDoc ? (
                        <div className="text-[10px] text-[#059669] flex items-center gap-2 font-bold tracking-widest uppercase">
                          <CheckCircle2 className="w-4 h-4" /> Secured by AEGIS
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#A8A29E] font-bold tracking-widest uppercase">
                          Awaiting Cryptographic Lock
                        </div>
                      )}
                    </div>

                    {!uploadedDoc ? (
                      <div className="relative w-full md:w-auto">
                        <input 
                          type="file" 
                          accept="image/*, application/pdf"
                          onChange={e => handleUpload(e, docType)}
                          disabled={uploading === docType}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                        />
                        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#292524] hover:bg-[#1C1917] text-[#F9F7F2] text-xs font-semibold uppercase tracking-widest rounded-2xl transition-colors disabled:opacity-50">
                          {uploading === docType ? <><Loader2 className="w-4 h-4 animate-spin"/> Validating AI</> : 'Upload Proof'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-left md:text-right w-full md:w-auto bg-[#F9F7F2] p-3 rounded-xl border border-[#E5E0D8]">
                        <div className="text-[10px] text-[#A8A29E] uppercase tracking-widest font-bold mb-1">SHA-256 Hash Block</div>
                        <div className="font-mono text-xs text-[#57534E]">
                          {uploadedDoc.hash.substring(0, 24)}...
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {uploadedDoc?.ai_validation_log && (
                    <div className="mt-5 pt-5 border-t border-[#E5E0D8] text-xs text-[#78716C] font-light italic leading-relaxed">
                      " {uploadedDoc.ai_validation_log} " <br/><strong className="font-bold text-[10px] uppercase tracking-widest text-[#B45309] block mt-2">GEMINI VISION AI STATUS</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Col: Master QR */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="md:w-96 flex-shrink-0"
        >
          <div className="sticky top-32">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A8A29E] border-b border-[#E5E0D8] pb-4 mb-6">Master Cryptographic Key</h2>
            
            {qrCode ? (
              <div className="paper-card p-8 rounded-[2.5rem] flex flex-col items-center shadow-2xl relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#059669] rounded-full blur-[60px] opacity-20 pointer-events-none" />
                <div className="w-full bg-[#FFFFFF] p-6 rounded-3xl mb-8 border border-[#E5E0D8] shadow-inner">
                  <Image src={qrCode} alt="Master QR" width={400} height={400} className="w-full h-auto object-contain mix-blend-multiply" />
                </div>
                <h3 className="font-serif text-3xl font-medium text-[#292524] mb-3 text-center">Cleared for Entry</h3>
                <p className="text-center text-sm text-[#78716C] font-light leading-relaxed mb-8">
                  Present this mathematically secure key to the Examiner at the entrance. Your identity is impenetrable.
                </p>
                <a href={qrCode} download={`AEGIS-${student.roll_number}-QR.png`} className="w-full block text-center py-4 bg-[#B45309] hover:bg-[#92400E] text-[#F9F7F2] text-xs uppercase font-bold tracking-widest rounded-2xl transition-colors shadow-lg">
                  Persist Key Locally
                </a>
              </div>
            ) : (
              <div className="p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-70 border-2 border-dashed border-[#D4C5B0] bg-[#F9F7F2]">
                <QrCode className="w-12 h-12 text-[#A8A29E] mb-6 stroke-[1]" />
                <h3 className="font-serif text-2xl font-medium text-[#57534E] mb-3">Key Locked</h3>
                <p className="text-xs text-[#A8A29E] font-medium uppercase tracking-[0.1em] leading-loose">
                  Upload all 3 identity proofs to synthesize your Master Key.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
