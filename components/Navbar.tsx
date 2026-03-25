'use client';

import Link from 'next/link';
import { ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-[11px] uppercase tracking-widest font-medium text-[#57534E] hover:text-[#1C1917] transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
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
