'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 font-sans text-[#292524] py-12">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md text-center">
        <Link href="/auth" className="inline-flex items-center gap-2 text-[#78716C] hover:text-[#1C1917] transition-colors mb-10 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Roles
        </Link>

        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#EBE6DF] rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-[#E5E0D8]">
            <Briefcase className="w-10 h-10 text-[#B45309] stroke-[1.5]" />
          </div>
          <h1 className="font-serif text-5xl font-medium tracking-tight text-[#1C1917] mb-2">Admin Clearance</h1>
          <p className="text-sm text-[#78716C] font-light max-w-[280px]">Provide your local credentials and authenticator code for tier-1 access.</p>
        </div>

        <form onSubmit={handleLogin} className="paper-card p-10 rounded-[3rem] space-y-10">
          {error && (
            <div className="p-4 text-xs tracking-wide rounded-xl border bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">{error}</div>
          )}

          <div className="space-y-6">
            <div className="text-left">
              <label className="block text-[10px] tracking-[0.3em] font-bold text-[#A8A29E] uppercase mb-4 ml-1">Admin Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#B45309] focus:border-[#B45309] transition-all" 
                required 
              />
            </div>

            <div className="text-left">
              <label className="block text-[10px] tracking-[0.3em] font-bold text-[#A8A29E] uppercase mb-4 ml-1">Authenticator Code</label>
              <input 
                suppressHydrationWarning
                type="text" 
                maxLength={6}
                placeholder="000000"
                value={token} 
                onChange={e => setToken(e.target.value.replace(/\D/g, ''))} 
                className="w-full text-center text-3xl font-mono tracking-[0.6em] py-5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#B45309] focus:border-[#B45309] transition-all placeholder:text-[#EBE6DF]" 
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full group flex justify-between items-center px-8 py-5 bg-[#292524] hover:bg-[#1C1917] text-[#F9F7F2] text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all disabled:opacity-30">
            <span>Verify & Authenticate</span>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-12 text-[10px] uppercase tracking-widest text-[#A8A29E] font-bold">
           Clearance Level: Tier-1 (Zero Knowledge)
        </div>
      </motion.div>
    </div>
  );
}
