'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { Loader2, ArrowLeft, Trash2, CalendarDays, FileText, UserSquare2, ShieldCheck, Hash, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import VerificationBadge from '@/components/VerificationBadge';

type Certificate = {
  id: string;
  file_name: string;
  recipient_name: string;
  issued_by: string;
  status: 'VALID' | 'REVOKED';
  created_at: string;
  hash: string;
  signature: string;
};

export default function CertificateDetail() {
  const params = useParams();
  const router = useRouter();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();

      // detail
      const res = await fetch(`/api/certificates/${params.id}`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!res.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setCert(data.certificate);

      // fetch QR
      const qrRes = await fetch(`/api/certificates/${params.id}/qr`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrCode(qrData.qrDataUrl);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [params.id, router]);

  const handleRevoke = async () => {
    if (!confirm('Are you absolutely sure you want to revoke this certificate? This action cannot be undone and scans will show as REVOKED immediately.')) return;
    
    setRevoking(true);
    const user = auth.currentUser;
    const idToken = await user?.getIdToken();
    const res = await fetch(`/api/certificates/${params.id}/revoke`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${idToken}` },
    });
    if (res.ok) {
      setCert(prev => prev ? { ...prev, status: 'REVOKED' } : null);
    }
    setRevoking(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!cert) return null;

  const dateStr = new Date(cert.created_at).toLocaleDateString('en-US', {
    dateStyle: 'long', timeStyle: 'short'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Col - Details */}
        <div className="flex-1 space-y-6">
          <div className="glass p-8 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-slate-900 flex-1 pr-4">{cert.file_name}</h1>
              <VerificationBadge status={cert.status} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <UserSquare2 className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Recipient</p>
                  <p className="font-medium text-slate-900 text-lg">{cert.recipient_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Issuer</p>
                  <p className="font-medium text-slate-900">{cert.issued_by}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Issue Date</p>
                  <p className="text-slate-900">{dateStr}</p>
                </div>
              </div>
            </div>
            
            <hr className="my-8 border-slate-200" />

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1 mb-2">
                  <Hash className="w-4 h-4 text-slate-400" /> Cryptographic File Hash (SHA-256)
                </p>
                <div className="bg-slate-900 p-4 rounded-xl text-slate-300 font-mono text-sm break-all">
                  {cert.hash}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1 mb-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Digital Signature (RSA-PSS)
                </p>
                <div className="bg-slate-900 p-4 rounded-xl text-slate-300 font-mono text-xs break-all max-h-32 overflow-y-auto">
                  {cert.signature}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - QR & Actions */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass p-6 rounded-3xl shadow-sm text-center">
            <h3 className="font-bold text-slate-900 mb-4">Verification QR</h3>
            {qrCode ? (
              <QRCodeDisplay dataUrl={qrCode} />
            ) : (
              <div className="w-full h-64 bg-slate-100 rounded-xl animate-pulse"></div>
            )}
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Anyone scanning this QR code will see the verification screen for this document.
            </p>
          </div>

          <div className="glass p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-2">Actions</h3>
            {cert.status === 'VALID' ? (
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Revoke Certificate
              </button>
            ) : (
              <p className="text-sm text-orange-600 mt-4 flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4" /> This certificate is revoked.
              </p>
            )}
            {cert.status === 'VALID' && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                Revoking immediately marks scans as invalid.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
