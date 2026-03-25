'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ScanLine, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScannerHome() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Example expected URL: "http://localhost:3000/verify/student/1234-abcd"  
  const handleScan = (detectedCodes: any[]) => {
    if (!scanning || loadingRoute || detectedCodes.length === 0) return;
    
    setScanning(false);
    setLoadingRoute(true);

    const matchText = detectedCodes[0].rawValue;
    
    try {
      // Create a URL object to extract pathname safely
      const url = new URL(matchText);
      // Ensure it's a valid Aegis QR code
      if (url.pathname.startsWith('/verify/student/')) {
        router.push(url.pathname);
      } else {
        alert("Invalid QR Code: Not an Aegis Student Code.");
        setScanning(true);
        setLoadingRoute(false);
      }
    } catch (e) {
      alert("Invalid QR format. Could not parse URL.");
      setScanning(true);
      setLoadingRoute(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-sans text-[#292524] flex flex-col items-center justify-center p-4 py-20 relative overflow-hidden">
      {/* Background Blobs for Daylight Aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#E2D2B0] blur-[120px] mix-blend-multiply opacity-40" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="max-w-md w-full text-center relative z-10"
      >
        <div className="w-20 h-20 bg-[#EBE6DF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ScanLine className="w-10 h-10 text-[#B45309] stroke-[1.5]" />
        </div>
        
        <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1C1917] mb-4 tracking-tight">Examiner Terminal</h1>
        <p className="text-[#78716C] font-light leading-relaxed mb-12">
          Your device is authorized to decrypt Aegis Master QRs. Position the candidate's cryptographic key within the frame.
        </p>

        {loadingRoute ? (
          <div className="paper-card p-12 rounded-[2rem] border border-[#E5E0D8] flex flex-col items-center justify-center mt-8 shadow-2xl">
            <Loader2 className="w-12 h-12 text-[#B45309] animate-spin mb-6 stroke-[1.5]" />
            <h3 className="font-serif text-2xl font-medium text-[#292524] mb-2">Decrypting Block...</h3>
            <p className="text-xs text-[#A8A29E] uppercase tracking-widest font-bold">Routing to Cryptographic Ledger</p>
          </div>
        ) : (
          <div className="paper-card p-6 rounded-[2rem] border border-[#E5E0D8] shadow-2xl bg-[#FFFFFF] relative overflow-hidden">
            <div className="w-full aspect-square bg-[#1C1917] rounded-3xl overflow-hidden relative shadow-inner flex items-center justify-center">
              
              <div className="absolute inset-0 z-10 pointer-events-none ring-4 ring-inset ring-[#B45309]/50 rounded-3xl" />
              
              {/* Native React QR Library */}
              <Scanner
                onScan={handleScan}
                constraints={{ facingMode: 'environment' }}
                components={{ finder: false }}
                styles={{ container: { width: '100%', height: '100%' } }}
              />

            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#059669] stroke-[1.5]" />
              <div className="text-left">
                <h3 className="text-sm font-bold text-[#292524] tracking-wide">Live Camera Feed Active</h3>
                <p className="text-[10px] text-[#A8A29E] uppercase tracking-widest font-bold">Secure connection established</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
