'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, Eye, Shield, ScanLine, ArrowRight } from 'lucide-react';

// Premium Magnetic Button Component used in high-end agency sites
const MagneticButton = ({ children, href }: { children: React.ReactNode; href: string }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = e.currentTarget.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.2, y: y * 0.2 });
  };
  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block relative z-20"
    >
      <Link href={href} className="flex items-center gap-4 px-10 py-5 bg-[#1C1917] text-[#F9F7F2] rounded-full text-sm uppercase tracking-[0.2em] font-bold hover:bg-[#B45309] transition-colors duration-500 shadow-2xl overflow-hidden group">
        <span className="relative z-10">{children}</span>
        <motion.div 
           className="w-2 h-2 rounded-full bg-[#E2D2B0] relative z-10 group-hover:scale-[2] group-hover:bg-[#F9F7F2] transition-all"
        />
      </Link>
    </motion.div>
  );
};

// Character-by-character text reveal
const RevealText = ({ text, delayOffset = 0 }: { text: string; delayOffset?: number }) => {
  return (
    <span className="inline-block">
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delayOffset + index * 0.03, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// Animated scrolling stream of cryptographic hashes
const HashStream = () => {
  const hashes = Array.from({ length: 15 }, () => 
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  );

  return (
    <div className="absolute inset-x-0 inset-y-12 z-0 overflow-hidden opacity-30 mask-image-vertical flex flex-col gap-6 py-4 pointer-events-none">
      <motion.div
        animate={{ y: [0, -1500] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex flex-col gap-6 font-mono text-sm tracking-widest text-[#E2D2B0] break-all leading-relaxed whitespace-pre-wrap px-8 text-center"
      >
        {hashes.map((h, i) => <div key={i}>{h}</div>)}
        {hashes.map((h, i) => <div key={`dup-${i}`}>{h}</div>)}
      </motion.div>
    </div>
  );
};

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  
  // Parallax transforms
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const yCards = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const scaleImage = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#F9F7F2] font-sans text-[#292524] relative overflow-x-hidden selection:bg-[#E2D2B0]/50">
      <div className="noise-overlay" />
      
      {/* Absolute fluid gradient layer */}
      <div className="absolute top-0 left-0 w-full h-[150vh] overflow-hidden z-0 flex justify-center items-center pointer-events-none">
        <div className="fluid-bg" />
      </div>

      {/* Hero Section */}
      <motion.section 
        style={{ y: yHero, opacity: opacityHero }}
        className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center z-10 -mt-20"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
           <ShieldCheck className="w-16 h-16 text-[#B45309] stroke-[1]" />
        </motion.div>

        <h1 className="font-serif text-[5rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem] font-medium tracking-tighter mb-6 leading-[0.85] text-[#1C1917]">
          <RevealText text="Aegis." />
        </h1>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#57534E] italic font-light mb-16 tracking-tight"
        >
          Trust, verified.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 2, delay: 1, ease: "easeOut" }}
          className="text-lg sm:text-2xl text-[#78716C] max-w-3xl mx-auto mb-20 font-light tracking-wide leading-relaxed"
        >
          The death of fragile cryptography. We fuse Multimodal Vision AI with unbreakable asymmetric mathematical proofs to permanently secure academic records.
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 1.5 }}
        >
          <MagneticButton href="/auth">Initialize Engine</MagneticButton>
        </motion.div>
      </motion.section>

      {/* Immense Parallax Cinematic Section */}
      <section className="relative z-20 bg-[#1C1917] text-[#F9F7F2] py-40 overflow-hidden">
        {/* Dark theme noise overlay just for this section */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-10 mix-blend-screen pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-200px" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#A8A29E] mb-8">The Philosophy</h2>
            <h3 className="font-serif text-5xl md:text-7xl font-medium mb-10 leading-[1.05]">
              Paper is <span className="italic text-[#E2D2B0]">obsolete.</span>
            </h3>
            <p className="text-[#A8A29E] text-xl font-light leading-relaxed mb-8">
              For decades, verifying an identity required blindly trusting a printed piece of paper or a stamped seal that can be easily forged. 
            </p>
            <p className="text-[#A8A29E] text-xl font-light leading-relaxed">
              Aegis changes the geometry of trust. We reduce thousands of hours of manual verification down to a <strong className="text-white font-medium">three-second cryptographic scan</strong> that mathematically proves undeniable authenticity.
            </p>
          </motion.div>

          <motion.div 
            style={{ scale: scaleImage }}
            initial={{ opacity: 0, filter: "blur(20px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-200px" }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-full aspect-[4/5] bg-gradient-to-br from-[#292524] to-[#1C1917] rounded-[3rem] border border-[#3E3832] p-12 flex flex-col justify-between shadow-2xl overflow-hidden relative"
          >
             <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B45309] rounded-full blur-[100px] opacity-20 pointer-events-none" />
             
             {/* The new Crypto Hash Stream animation filling the void */}
             <HashStream />

             <Shield className="w-16 h-16 text-[#E2D2B0] stroke-[1] mb-8 relative z-10" />
             <div className="relative z-10 mix-blend-screen shadow-2xl p-4 -mx-4 bg-[#1C1917]/50 backdrop-blur-md rounded-2xl border border-white/5">
               <div className="font-serif text-3xl text-white mb-2">RSA-2048 PSS</div>
               <div className="text-[#A8A29E] font-mono text-sm">ASYMMETRIC SIGNATURE VERIFICATION</div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* The Protocol Steps with Parallax Staggering */}
      <section className="relative z-30 max-w-7xl mx-auto px-4 md:px-8 py-40">
        <div className="text-center mb-32">
          <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#A8A29E] mb-8">The Protocol</h2>
          <h3 className="font-serif text-5xl md:text-7xl font-medium text-[#1C1917] tracking-tight">
            How we <em className="italic text-[#B45309]">forge truth.</em>
          </h3>
        </div>

        <motion.div style={{ y: yCards }} className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          
          {[
            {
              icon: Eye,
              title: "Vision Analysis",
              desc: "Documents are analyzed by Gemini 1.5. It scrutinizes formatting, watermarks, and structural validity exactly like a forensic examiner.",
              delay: 0
            },
            {
              icon: Shield,
              title: "Cryptographic Lock",
              desc: "Authentic documents are digested into a SHA-256 hash and structurally signed via 2048-bit RSA. Mathematically impenetrable.",
              delay: 0.1
            },
            {
              icon: ScanLine,
              title: "Master Key Scan",
              desc: "A singular Master QR Code is bound to the student. Scanning it instantly evaluates the mathematical proofs in real-time.",
              delay: 0.2
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}
              className="group cursor-default"
            >
              <div className="paper-card rounded-[2.5rem] p-12 h-full flex flex-col transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-[#D4C5B0]/40">
                <div className="w-16 h-16 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-10 transition-transform duration-700 group-hover:scale-110 group-hover:bg-[#1C1917]">
                  <item.icon className="w-8 h-8 text-[#B45309] stroke-[1] group-hover:text-[#E2D2B0] transition-colors duration-700" />
                </div>
                <h4 className="font-serif text-3xl font-medium mb-6 text-[#1C1917]">{item.title}</h4>
                <p className="text-[#78716C] leading-relaxed font-light text-lg">
                  {item.desc}
                </p>
                <div className="mt-auto pt-8">
                  <div className="w-full h-[1px] bg-[#E5E0D8] group-hover:bg-[#1C1917] transition-colors duration-700 max-w-[50%]" />
                </div>
              </div>
            </motion.div>
          ))}

        </motion.div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-[#1C1917] text-[#A8A29E] py-12 text-center text-sm font-light">
        <p className="tracking-widest uppercase text-[10px]">Aegis Cryptographic Systems © 2026</p>
      </footer>

    </div>
  );
}
