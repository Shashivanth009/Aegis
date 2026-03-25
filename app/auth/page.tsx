'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, UserCircle, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';

const ROLES = [
  {
    key: 'admin',
    icon: Briefcase,
    title: 'Administrator',
    desc: 'Manage students, review AI validation logs, approve or reject profiles.',
    href: '/auth/admin',
    color: '#B45309',
  },
  {
    key: 'examiner',
    icon: UserCircle,
    title: 'Examiner',
    desc: 'Scan student QR codes at the exam hall and verify cryptographic proofs.',
    href: '/auth/examiner',
    color: '#059669',
  },
  {
    key: 'student',
    icon: GraduationCap,
    title: 'Student',
    desc: 'Upload your identity documents and receive your Master QR key.',
    href: '/auth/student',
    color: '#7C3AED',
  },
];

export default function AuthLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 font-sans text-[#292524] py-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl"
      >
        <div className="flex justify-center mb-8">
          <ShieldCheck className="w-14 h-14 text-[#B45309] stroke-[1]" />
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl font-medium text-center mb-3 tracking-tight text-[#1C1917]">
          Clearance Protocol
        </h1>
        <p className="text-center text-[#78716C] mb-16 font-light tracking-wide text-lg max-w-xl mx-auto">
          Identify your role to initialize the cryptographic session.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role, idx) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.key}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={role.href}>
                  <div className="paper-card p-8 rounded-[2rem] border border-[#E5E0D8] h-full flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#D4C5B0]/30 group relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[50px] opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: role.color }} />
                    
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-[#E5E0D8] bg-[#F9F7F2] group-hover:bg-[#1C1917] transition-colors duration-500">
                      <Icon className="w-7 h-7 stroke-[1.5] transition-colors duration-500" style={{ color: role.color }} />
                    </div>

                    <h3 className="font-serif text-2xl font-medium text-[#1C1917] mb-3">{role.title}</h3>
                    <p className="text-sm text-[#78716C] font-light leading-relaxed mb-6 flex-1">{role.desc}</p>

                    <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#A8A29E] group-hover:text-[#1C1917] transition-colors">
                      <span>Enter Gateway</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
