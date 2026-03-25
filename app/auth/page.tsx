'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, UserCircle, Briefcase, GraduationCap } from 'lucide-react';

type Role = 'ADMIN' | 'EXAMINER' | 'STUDENT';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');

  const supabase = createSupabaseBrowserClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Log in
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Fetch user role to determine routing
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', authData.user.id).single();
        const role = roleData?.role || 'STUDENT';

        if (role === 'ADMIN') window.location.href = '/dashboard';
        else if (role === 'EXAMINER') window.location.href = '/scanner';
        else window.location.href = '/student';

      } else {
        // Register using custom protected Next.js API route to assign role
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: selectedRole })
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Registration failed');

        // Automatically sign them in after successful registration
        await supabase.auth.signInWithPassword({ email, password });
        
        if (selectedRole === 'ADMIN') window.location.href = '/dashboard';
        else if (selectedRole === 'EXAMINER') window.location.href = '/scanner';
        else window.location.href = '/student';
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const ROLE_CONFIGS = {
    ADMIN: { icon: Briefcase, title: 'Institution Admin', desc: 'Securely enroll students and issue cryptographic proofs.' },
    EXAMINER: { icon: UserCircle, title: 'Forensic Examiner', desc: 'Access the terminal to scan and verify student integrity.' },
    STUDENT: { icon: GraduationCap, title: 'Student Portal', desc: 'View your mathematically secured academic profile.' }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 font-sans text-[#292524] py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <div className="flex justify-center mb-8">
          <ShieldCheck className="w-12 h-12 text-[#B45309] stroke-[1.2]" />
        </div>
        
        <h1 className="font-serif text-5xl font-medium text-center mb-2 tracking-tight">
          {isLogin ? 'Authenticate' : 'Establish Identity'}
        </h1>
        <p className="text-center text-[#78716C] mb-12 font-light tracking-wide text-sm">
          {isLogin ? 'Select your clearance level and provide credentials.' : 'Select your requested role to register a new profile.'}
        </p>

        {/* Role Selector Tabs (Only show during signup, or let them pick role context) */}
        {!isLogin && (
          <div className="flex p-1 bg-[#EBE6DF] rounded-2xl mb-8">
            {(['EXAMINER', 'STUDENT'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`flex-1 flex flex-col items-center justify-center py-3 text-xs uppercase tracking-widest font-bold rounded-xl transition-all duration-300 ${
                  selectedRole === r 
                    ? 'bg-[#F9F7F2] text-[#292524] shadow-sm' 
                    : 'text-[#A8A29E] hover:text-[#78716C]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAuth} className="paper-card p-10 rounded-3xl space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedRole}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 p-4 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl mb-6"
            >
              {(() => {
                const Conf = ROLE_CONFIGS[selectedRole];
                const Icon = Conf.icon;
                return (
                  <>
                    <div className="w-10 h-10 bg-[#EBE6DF] rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#B45309] stroke-[1.5]" />
                    </div>
                    <div>
                      <div className="font-serif text-lg font-medium text-[#292524]">{Conf.title}</div>
                      <div className="text-xs text-[#78716C] font-light">{Conf.desc}</div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="p-4 text-xs tracking-wide rounded-xl border bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#B45309] focus:border-[#B45309] text-[#292524] transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] tracking-[0.15em] font-bold text-[#A8A29E] uppercase mb-2 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-[#F9F7F2] border border-[#E5E0D8] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#B45309] focus:border-[#B45309] text-[#292524] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group flex justify-between items-center px-6 py-4 bg-[#292524] hover:bg-[#1C1917] text-[#F9F7F2] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all disabled:opacity-50 mt-4"
          >
            <span>{isLogin ? 'Login to Engine' : 'Request Role Clearance'}</span>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-light text-[#78716C]">
          {isLogin ? "Don't have clearance? " : "Already established? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-[#B45309] hover:text-[#92400E] font-medium transition-colors border-b border-transparent hover:border-[#92400E]"
          >
            {isLogin ? 'Initiate protocol here.' : 'Authenticate here.'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
