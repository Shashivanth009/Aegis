import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import CustomCursor from '@/components/CustomCursor';
import { AuthProvider } from '@/lib/firebase/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant' 
});

export const metadata: Metadata = {
  title: 'AAGEIS',
  description: 'Unforgeable cryptographic student certificates.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className={`font-sans bg-[#F9F7F2] text-[#292524] min-h-screen flex flex-col antialiased selection:bg-[#E2D2B0]/50 cursor-none relative overflow-x-hidden`}>
        <div className="noise-overlay" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 flex justify-center items-center pointer-events-none">
          <div className="fluid-bg" />
        </div>
        
        <AuthProvider>
          <CustomCursor />
          <Navbar />
          <main className="flex-1 flex flex-col relative z-10 w-full overflow-x-hidden pt-24">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
