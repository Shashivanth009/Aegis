'use client';

import { useRef, useState, useEffect } from 'react';
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
  const [hashes, setHashes] = useState<string[]>([]);

  useEffect(() => {
    const generatedHashes = Array.from({ length: 15 }, () => 
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    );
    setHashes(generatedHashes);
  }, []);

  if (hashes.length === 0) return null;

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
  const yCards = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const scaleImage = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen relative selection:bg-[#E2D2B0]/50 pt-32">
      
      {/* Hero Section */}
      <motion.section 
        style={{ y: yHero, opacity: opacityHero }}
        className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center z-10"
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
          Unbreakable mathematical proofs fused with Multimodal Vision AI. Aegis permanently secures the integrity of academic records against all forms of structural and digital forgery.
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 1.5 }}
        >
          <MagneticButton href="/auth">Initialize Protocol</MagneticButton>
        </motion.div>
      </motion.section>

      {/* Immense Parallax Cinematic Section */}
      <section className="relative z-20 bg-[#1C1917] text-[#F9F7F2] py-40 overflow-hidden mt-40 rounded-t-[5rem]">
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
              Verification traditionally relied on blind trust in printed seals—physical relics that are trivial to forge in a digital era.
            </p>
            <p className="text-[#A8A29E] text-xl font-light leading-relaxed">
              Aegis reduces manual labor to a <strong className="text-white font-medium">three-second scan</strong>. We don't just "check" documents; we prove their mathematical existence at the point of origin.
            </p>
          </motion.div>

          <motion.div 
            style={{ scale: scaleImage }}
            className="w-full aspect-[4/5] bg-gradient-to-br from-[#292524] to-[#1C1917] rounded-[3rem] border border-[#3E3832] p-12 flex flex-col justify-between shadow-2xl overflow-hidden relative"
          >
             <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B45309] rounded-full blur-[100px] opacity-20 pointer-events-none" />
             <HashStream />
             <Shield className="w-16 h-16 text-[#E2D2B0] stroke-[1] mb-8 relative z-10" />
             <div className="relative z-10 mix-blend-screen shadow-2xl p-6 bg-[#1C1917]/50 backdrop-blur-md rounded-2xl border border-white/10">
               <div className="font-serif text-3xl text-white mb-2 tracking-tight">RSA-2048 PSS</div>
               <div className="text-[#A8A29E] font-mono text-sm tracking-widest">ASYMMETRIC MATHEMATICAL PROOF</div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Increased Info: The Cryptographic Core */}
      <section className="bg-white py-40 relative z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-20 items-center">
             <div className="flex-1 space-y-12">
                <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#A8A29E]">The Architecture</h2>
                <h3 className="font-serif text-5xl md:text-6xl font-medium text-[#1C1917] tracking-tight leading-tight">
                  Three layers of <br/><span className="italic text-[#B45309]">cryptographic defense.</span>
                </h3>
                
                <div className="space-y-8">
                   <div className="flex gap-6 items-start">
                      <div className="text-2xl font-serif italic text-[#B45309] mt-1">01</div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest mb-2">Forensic Vision Layer</h4>
                        <p className="text-[#78716C] font-light leading-relaxed">Gemini 1.5 Flash scrutinizes sub-pixel patterns, emblems, and layout grids to detect structural anomalies impossible for the human eye to find.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 items-start">
                      <div className="text-2xl font-serif italic text-[#B45309] mt-1">02</div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest mb-2">Digestive Immutability</h4>
                        <p className="text-[#78716C] font-light leading-relaxed">Each validated document is distilled into a SHA-256 hash. Any modification—even a single bit change—invalidates the entire cryptographic chain.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 items-start">
                      <div className="text-2xl font-serif italic text-[#B45309] mt-1">03</div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest mb-2">Asymmetric Sealing</h4>
                        <p className="text-[#78716C] font-light leading-relaxed">The final record is bound using an RSA Private Key. Verification is performable by anyone with the Public Key, but forgery is mathematically impossible.</p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex-1 w-full bg-[#F9F7F2] rounded-[3rem] p-12 aspect-square flex flex-col justify-center items-center shadow-inner border border-[#E5E0D8] relative overflow-hidden group">
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                   <div className="grid grid-cols-8 gap-4 p-8">
                      {Array.from({length: 64}).map((_, i) => <div key={i} className="aspect-square bg-[#292524] rounded-sm" />)}
                   </div>
                </div>
                <div className="text-center relative z-10">
                   <ScanLine className="w-24 h-24 text-[#B45309] mx-auto mb-8 stroke-[0.5]" />
                   <div className="font-serif text-3xl font-medium mb-4">AEGIS-CORE-v1</div>
                   <div className="text-xs font-bold tracking-[0.2em] text-[#A8A29E] uppercase">ACTIVE ENGINE STATE: SECURE</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <footer className="bg-[#1C1917] text-[#A8A29E] py-40 text-center relative z-20 rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto px-4">
          <ShieldCheck className="w-16 h-16 text-[#B45309] mx-auto mb-10 opacity-80" />
          <h2 className="font-serif text-4xl text-white mb-8">Securing the next billion certificates.</h2>
          <div className="w-24 h-px bg-[#3E3832] mx-auto mb-12" />
          <p className="tracking-widest uppercase text-[10px] font-bold mb-4">Aegis Cryptographic Systems</p>
          <p className="text-xs font-light text-[#57534E]">Designed for the era of unbreakable trust. © 2026</p>
        </div>
      </footer>

    </div>
  );
}
