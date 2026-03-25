'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { UploadCloud, File, ShieldCheck, Loader2 } from 'lucide-react';
import QRCodeDisplay from '@/components/QRCodeDisplay';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [recipient, setRecipient] = useState('');
  const [issuer, setIssuer] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Result state
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [certId, setCertId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !recipient || !issuer) return;

    setError(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('recipient_name', recipient);
      formData.append('issued_by', issuer);

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setQrCodeData(data.qrDataUrl);
      setCertId(data.certificate.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (qrCodeData && certId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass p-12 text-center rounded-3xl border border-emerald-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>
          
          <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <ShieldCheck className="w-10 h-10" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Certificate Secured</h2>
          <p className="text-slate-600 mb-8 max-w-sm mx-auto">
            The document has been cryptographically signed and secured on AEGIS.
          </p>

          <div className="bg-white p-6 rounded-2xl shadow-sm inline-block mb-8 border border-slate-100">
            <QRCodeDisplay dataUrl={qrCodeData} />
            <p className="text-xs text-slate-400 mt-4 font-mono">ID: {certId}</p>
          </div>

          <div>
            <button
              onClick={() => router.push(`/certificates/${certId}`)}
              className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
            >
              View Certificate Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Issue New Certificate</h1>
        <p className="text-slate-500 mt-1">Upload a document to generate a cryptographic proof and verification QR code.</p>
      </div>

      <div className="glass p-8 sm:p-10 rounded-3xl shadow-sm">
        <form onSubmit={handleUpload} className="space-y-8">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* FIle Upload Zone */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">Document (PDF, PNG, JPG)</label>
            <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-slate-300 border-dashed rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors relative group">
              <div className="space-y-2 text-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    <File className="mx-auto h-12 w-12 text-indigo-500 mb-2" />
                    <span className="text-slate-900 font-medium">{file.name}</span>
                    <span className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,image/png,image/jpeg"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">Max size 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="recipient" className="block text-sm font-semibold text-slate-900 mb-2">Recipient Name</label>
              <input
                type="text"
                id="recipient"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="issuer" className="block text-sm font-semibold text-slate-900 mb-2">Issuer Name / Authority</label>
              <input
                type="text"
                id="issuer"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                placeholder="MIT University"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Generating Proof & Formatting Data...
                </>
              ) : (
                'Generate Cryptographic Certificate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
