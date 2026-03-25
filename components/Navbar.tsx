'use client';

import Link from 'next/link';
import { ShieldCheck, LogOut, LayoutDashboard, ScanLine, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
        setRole(data?.role || null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
        setRole(data?.role || null);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    router.push('/');
  };

  const getDashboardLink = () => {
    if (role === 'ADMIN') return { href: '/dashboard', label: 'Ledger', icon: LayoutDashboard };
    if (role === 'EXAMINER') return { href: '/scanner', label: 'Scanner', icon: ScanLine };
    if (role === 'STUDENT') return { href: '/student', label: 'Portal', icon: GraduationCap };
    return { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard };
  };

  const dashInfo = getDashboardLink();
  const DashIcon = dashInfo.icon;

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="paper-glass rounded-full px-5 sm:px-8 py-3.5 flex items-center justify-between w-full max-w-4xl pointer-events-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <ShieldCheck className="w-5 h-5 text-[#B45309] group-hover:scale-110 transition-transform stroke-[1.5]" />
            <span className="font-serif text-lg font-medium text-[#1C1917] tracking-widest">AEGIS</span>
          </Link>
        </div>

        <div className="flex flex-1 justify-end items-center space-x-2 sm:space-x-6">
          {user ? (
            <>
              {role && (
                <span className="hidden sm:inline text-[9px] uppercase tracking-[0.2em] font-bold text-[#A8A29E] bg-[#EBE6DF] px-3 py-1 rounded-full">
                  {role}
                </span>
              )}
              <Link
                href={dashInfo.href}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-[11px] uppercase tracking-widest font-medium text-[#57534E] hover:text-[#1C1917] transition-colors"
              >
                <DashIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dashInfo.label}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-[11px] uppercase tracking-widest font-medium text-[#57534E] hover:text-red-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
             <Link
               href="/auth"
               className="flex items-center gap-2 px-6 py-2.5 text-[11px] uppercase tracking-widest font-semibold text-[#F9F7F2] bg-[#292524] hover:bg-[#1C1917] rounded-full transition-colors"
             >
               Sign in
             </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
