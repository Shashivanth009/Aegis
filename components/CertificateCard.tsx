import Link from 'next/link';
import { FileText, CalendarDays, UserSquare2, ShieldCheck, ShieldAlert } from 'lucide-react';

type Props = {
  certificate: {
    id: string;
    file_name: string;
    recipient_name: string;
    issued_by: string;
    status: 'VALID' | 'REVOKED';
    created_at: string;
  };
};

export default function CertificateCard({ certificate }: Props) {
  const isValid = certificate.status === 'VALID';
  const dateStr = new Date(certificate.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Link 
      href={`/certificates/${certificate.id}`}
      className="block glass p-6 rounded-2xl hover:shadow-md transition-all hover:border-indigo-200 group relative overflow-hidden"
    >
      {/* Status Badge */}
      <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
        isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}>
        {isValid ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
        {certificate.status}
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          <FileText className="w-6 h-6" />
        </div>
        <div className="pr-16 break-all">
          <h3 className="font-semibold text-slate-900 line-clamp-1" title={certificate.file_name}>
            {certificate.file_name}
          </h3>
        </div>
      </div>

      <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <UserSquare2 className="w-4 h-4 text-slate-400" />
          <span className="truncate">Recipient: <strong className="font-medium text-slate-900">{certificate.recipient_name}</strong></span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span className="truncate">Issuer: <span className="text-slate-900">{certificate.issued_by}</span></span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span>Issued: {dateStr}</span>
        </div>
      </div>
    </Link>
  );
}
