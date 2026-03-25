import Image from 'next/image';

export default function QRCodeDisplay({ dataUrl }: { dataUrl: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 border-4 border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white p-2">
        <Image
          src={dataUrl}
          alt="Verification QR Code"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
      <a
        href={dataUrl}
        download="certificate_qr.png"
        className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-4 py-2 rounded-lg"
      >
        Download QR PNG
      </a>
    </div>
  );
}
