'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).single();
        if (roleData?.role !== 'STUDENT') {
          await supabase.auth.signOut();
          throw new Error('Access Denied. This portal is for Students only.');
        }

        window.location.href = '/student';
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'STUDENT' })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Registration failed');

        await supabase.auth.signInWithPassword({ email, password });
        window.location.href = '/student';
      }
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
          <div className="w-14 h-14 bg-[#EDE9FE] rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-[#7C3AED] stroke-[1.5]" />
          </div>
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-[#1C1917]">Student Portal</h1>
            <p className="text-sm text-[#78716C] font-light">Upload documents & receive your QR key.</p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="paper-card p-10 rounded-3xl space-y-6">
          {error && (
            <div className="p-4 text-xs tracking-wide rounded-xl border bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">{error}</div>
          )}

          <div>
            <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all" required />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all" required />
          </div>

          <button type="submit" disabled={loading} className="w-full group flex justify-between items-center px-6 py-4 bg-[#5B21B6] hover:bg-[#4C1D95] text-[#F9F7F2] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all disabled:opacity-50 mt-4">
            <span>{isLogin ? 'Login as Student' : 'Register as Student'}</span>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-light text-[#78716C]">
          {isLogin ? "Need a student account? " : "Already registered? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-[#7C3AED] hover:text-[#5B21B6] font-medium transition-colors border-b border-transparent hover:border-[#5B21B6]">
            {isLogin ? 'Register here.' : 'Login here.'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
