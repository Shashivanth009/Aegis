import { ShieldCheck, ShieldAlert, XOctagon } from 'lucide-react';

type Props = {
  status: 'VALID' | 'INVALID' | 'REVOKED';
};

export default function VerificationBadge({ status }: Props) {
  if (status === 'VALID') {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
        <ShieldCheck className="w-5 h-5" />
        CRYPTOGRAPHICALLY VALID
      </div>
    );
  }
  
  if (status === 'REVOKED') {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-200">
        <ShieldAlert className="w-5 h-5" />
        REVOKED BY ISSUER
      </div>
    );
  }

  // INVALID
  return (
    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
      <XOctagon className="w-5 h-5" />
      INVALID OR TAMPERED
    </div>
  );
}
