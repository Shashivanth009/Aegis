'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Verify role
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).single();
      if (roleData?.role !== 'ADMIN') {
        await supabase.auth.signOut();
        throw new Error('Access Denied. This portal is for Administrators only.');
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 font-sans text-[#292524] py-12">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md">
        <Link href="/auth" className="inline-flex items-center gap-2 text-[#78716C] hover:text-[#1C1917] transition-colors mb-10 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Roles
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-[#EBE6DF] rounded-2xl flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-[#B45309] stroke-[1.5]" />
          </div>
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-[#1C1917]">Admin Portal</h1>
            <p className="text-sm text-[#78716C] font-light">Institution administrator access only.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="paper-card p-10 rounded-3xl space-y-6">
          {error && (
            <div className="p-4 text-xs tracking-wide rounded-xl border bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">{error}</div>
          )}

          <div>
            <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Admin Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#B45309] focus:border-[#B45309] transition-all" required />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#B45309] focus:border-[#B45309] transition-all" required />
          </div>

          <button type="submit" disabled={loading} className="w-full group flex justify-between items-center px-6 py-4 bg-[#292524] hover:bg-[#1C1917] text-[#F9F7F2] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all disabled:opacity-50 mt-4">
            <span>Authenticate as Admin</span>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-[#A8A29E] font-light">Admin accounts cannot be self-registered. Contact your institution.</p>
      </motion.div>
    </div>
  );
}
