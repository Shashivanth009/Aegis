'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, ShieldAlert, XOctagon, CalendarDays, UserSquare2, Info } from 'lucide-react';
import VerificationBadge from '@/components/VerificationBadge';

type VerifyResult = {
  status: 'VALID' | 'INVALID' | 'REVOKED';
  reason?: string;
  suspicious?: boolean;
  warning?: string;
  certificate?: {
    recipient_name: string;
    issued_by: string;
    created_at: string;
    file_name: string;
    hash?: string;
  };
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setResult({ status: 'INVALID', reason: 'Missing verification token.' });
        setLoading(false);
        return;
      }
      
      const res = await fetch(`/api/verify?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      setResult(data);
      setLoading(false);
    }
    verify();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 rounded-full animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
        </div>
        <h2 className="mt-8 text-xl font-bold text-slate-900">Cryptographic Verification in Progress</h2>
        <p className="text-slate-500 mt-2 font-mono text-sm">Computing file hash and assessing RSA signature...</p>
      </div>
    );
  }

  if (!result) return null;

  const isInvalid = result.status === 'INVALID';
  const isRevoked = result.status === 'REVOKED';
  const isValid = result.status === 'VALID';

  // Determine border and shadow classes
  let containerClasses = "glass p-8 sm:p-12 rounded-3xl shadow-xl w-full max-w-2xl relative overflow-hidden transition-all ";
  if (isValid) containerClasses += "border-t-8 border-t-emerald-500 shadow-emerald-500/10";
  else if (isRevoked) containerClasses += "border-t-8 border-t-orange-500 shadow-orange-500/10";
  else containerClasses += "border-t-8 border-t-red-500 shadow-red-500/10";

  return (
    <div className="flex flex-col justify-center items-center py-16 px-4 flex-1 w-full relative z-10">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        {isValid && <div className="w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full"></div>}
        {isRevoked && <div className="w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full"></div>}
        {isInvalid && <div className="w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full"></div>}
      </div>

      <div className={containerClasses}>
        
        {/* Antigravity Agent Warning Overlay */}
        {result.suspicious && (
          <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-orange-800">
            <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Antigravity Security Alert</p>
              <p className="text-sm mt-1">{result.warning}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="inline-block mb-6 relative">
            {isValid && <ShieldCheck className="w-24 h-24 text-emerald-500 mx-auto" />}
            {isRevoked && <ShieldAlert className="w-24 h-24 text-orange-500 mx-auto" />}
            {isInvalid && <XOctagon className="w-24 h-24 text-red-500 mx-auto" />}
            <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full scale-150"></div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            {isValid && 'Certificate Verified'}
            {isRevoked && 'Certificate Revoked'}
            {isInvalid && 'Verification Failed'}
          </h1>
          
          <div className="flex justify-center">
            <VerificationBadge status={result.status} />
          </div>

          {isInvalid && (
            <p className="mt-6 text-red-600 font-medium bg-red-50 p-4 rounded-xl inline-block border border-red-100">
              Reason: {result.reason}
            </p>
          )}
        </div>

        {/* Certificate Data (if available) */}
        {result.certificate && (
          <div className="space-y-6 text-left">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Info className="w-5 h-5 text-slate-400" /> Certificate Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1">
                  <UserSquare2 className="w-3 h-3" /> Recipient
                </p>
                <p className="font-bold text-slate-900">{result.certificate.recipient_name}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Issuer
                </p>
                <p className="font-bold text-slate-900">{result.certificate.issued_by}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 sm:col-span-2">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Issue Date
                </p>
                <p className="font-bold text-slate-900">
                  {new Date(result.certificate.created_at).toLocaleDateString('en-US', {
                    dateStyle: 'long', timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>

            {result.certificate.hash && (
              <div className="mt-8">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Cryptographic Hash (SHA-256)</p>
                <div className="bg-slate-900 p-4 rounded-xl text-emerald-400 font-mono text-xs break-all border border-slate-800 shadow-inner">
                  {result.certificate.hash}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-slate-400 pt-6 border-t border-slate-100">
          <p>Secured by <strong>AEGIS</strong> Autonomus Cryptographic Engine.</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-24"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
