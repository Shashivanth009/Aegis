'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerifyStudent() {
  const { id } = useParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verify/student?id=${id}`);
        const json = await res.json();
        
        if (!res.ok) {
          setError(json.reason || json.error || 'Verification Failed');
          if (res.status === 401) {
            // Examiner not logged in
            router.push('/auth?redirect=/verify/student/' + id);
          }
        } else {
          setResult(json);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#B45309] animate-spin mb-6 stroke-[1.5]" />
        <h2 className="font-serif text-2xl font-medium text-[#292524] tracking-wide">Decrypting Cryptographic Proofs</h2>
        <p className="text-[#A8A29E] text-sm uppercase tracking-widest font-bold mt-2">Checking RSA-PSS Signatures</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FEF2F2] flex flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="w-20 h-20 text-[#DC2626] mb-8 stroke-[1.2]" />
        <h1 className="font-serif text-5xl font-medium text-[#7F1D1D] mb-4">ACCESS DENIED</h1>
        <p className="text-[#991B1B] max-w-md mx-auto leading-relaxed mb-8">{error}</p>
        <div className="bg-[#FECACA] text-[#991B1B] text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-lg">
          Fraud Detected / Unauthorized
        </div>
      </div>
    );
  }

  const { student, checklist, status, isAdmin } = result;

  if (!student) {
    return null;
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to update authorization status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] py-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Examiner Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C1917] text-[#F9F7F2] w-full text-center py-3 rounded-2xl mb-12 text-xs uppercase tracking-[0.2em] font-bold shadow-2xl flex items-center justify-center gap-2"
        >
          {isAdmin ? <ShieldAlert className="w-4 h-4 text-[#B45309]" /> : null}
          {isAdmin ? 'Admin Authorization Terminal' : 'Examiner Verification Terminal'}
        </motion.div>

        {/* Status Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`paper-card rounded-3xl p-10 text-center mb-8 border-t-8 ${status === 'VALID' ? 'border-t-[#059669]' : status === 'PENDING' || status === 'PENDING_DOCS' ? 'border-t-[#B45309]' : 'border-t-[#DC2626]'}`}
        >
          {status === 'VALID' ? (
            <div className="w-20 h-20 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#059669]" />
            </div>
          ) : status === 'PENDING' || status === 'PENDING_DOCS' ? (
            <div className="w-20 h-20 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-[#B45309]" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-[#DC2626]" />
            </div>
          )}
          
          <h2 className={`font-serif text-4xl sm:text-5xl font-medium mb-2 ${status === 'VALID' ? 'text-[#065F46]' : status === 'PENDING' || status === 'PENDING_DOCS' ? 'text-[#92400E]' : 'text-[#991B1B]'}`}>
            {status === 'VALID' ? 'CLEARED FOR ENTRY' : 
             status === 'PENDING' ? 'PENDING APPROVAL' : 
             status === 'PENDING_DOCS' ? 'DOCUMENTS PENDING' :
             status === 'REVOKED' ? 'ENTRY REVOKED' : 'VERIFICATION FAILED'}
          </h2>
          <p className="text-[#78716C] font-light">
            {status === 'VALID' ? 'Mathematically verified exactly as issued by the governing body.' :
             status === 'PENDING' ? 'This student is awaiting administrator approval.' :
             status === 'PENDING_DOCS' ? 'Student is approved but has not uploaded required documents yet.' :
             status === 'REVOKED' ? 'This student\'s entry authorization has been revoked by an administrator.' :
             'Cryptographic verification has failed. Documents may have been tampered with.'}
          </p>
        </motion.div>

        {/* Student Profile Card */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
           className="mb-8"
        >
          <div className="flex justify-between items-end mb-4 px-2">
            <div className="text-xs font-bold tracking-widest text-[#A8A29E] uppercase">Candidate Profile</div>
            <div className="text-xs font-bold tracking-widest text-[#B45309] uppercase bg-[#EBE6DF] px-3 py-1 rounded-full">{student.status}</div>
          </div>
          
          <div className="paper-card rounded-2xl p-8 flex flex-col sm:flex-row justify-between sm:items-center">
            <div>
              <h3 className="font-serif text-3xl font-medium text-[#292524] mb-1">{student.full_name}</h3>
              <p className="text-[#78716C] font-light">{student.exam_name}</p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#A8A29E] mb-1">Roll Number</div>
              <div className="font-mono text-xl text-[#B45309] bg-[#FEF3C7] px-4 py-2 rounded-xl border border-[#FDE68A]">{student.roll_number}</div>
            </div>
          </div>
        </motion.div>

        {/* Admin Controls */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 bg-[#EBE6DF] p-6 rounded-2xl border border-[#D4C5B0] flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <h4 className="font-serif text-lg font-medium text-[#1C1917]">Authorization Oversight</h4>
              <p className="text-xs text-[#78716C] mt-1 tracking-wide">Permanently set the ledger clearance level for this candidate.</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {student.status !== 'REJECTED' && (
                <button 
                  onClick={() => handleUpdateStatus('REJECTED')}
                  className="flex-1 sm:flex-none px-6 py-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] rounded-xl text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Reject
                </button>
              )}
              {student.status !== 'CLEARED' && (
                <button 
                  onClick={() => handleUpdateStatus('CLEARED')}
                  className="flex-1 sm:flex-none px-6 py-3 bg-[#1C1917] hover:bg-[#292524] text-[#F9F7F2] rounded-xl text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Approve
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Cryptographic Checklist */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="text-xs font-bold tracking-widest text-[#A8A29E] uppercase mb-4 pl-2">Cryptographic Origin Ledger</div>
          <div className="paper-card rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
            {checklist.map((doc: any, idx: number) => (
              <div key={idx} className="p-6 sm:p-8 hover:bg-[#F9F7F2] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif text-xl font-medium text-[#292524] mb-1">{doc.type.replace('_', ' ')}</h4>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] bg-[#E2D2B0]/30 text-[#78716C] px-2 py-1 rounded font-mono">
                        SHA-256: {doc.hashPreview}
                      </span>
                      {doc.isValid && (
                        <span className="text-[10px] bg-[#D1FAE5] text-[#059669] px-2 py-1 rounded uppercase tracking-wider font-bold">
                          RSA Signed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4">
                    {doc.isValid ? <CheckCircle2 className="w-6 h-6 text-[#059669]" /> : <XCircle className="w-6 h-6 text-[#DC2626]" />}
                  </div>
                </div>

                {doc.aiLog && (
                  <div className="mt-4 pt-4 border-t border-dashed border-[#E5E0D8] text-xs text-[#57534E] italic font-light">
                    " {doc.aiLog} "
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-12 text-center">
           <Link href="/" className="inline-flex items-center gap-2 text-[#A8A29E] hover:text-[#292524] transition-colors text-xs font-bold uppercase tracking-widest">
             <ArrowLeft className="w-4 h-4" /> Terminate Session
           </Link>
        </div>

      </div>
    </div>
  );
}
