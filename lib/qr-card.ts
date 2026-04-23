/**
 * Generates a clean, minimal AAGEIS certificate card with QR code.
 * Runs client-side using HTML Canvas API.
 */
export async function generateBrandedQRCard(
  qrDataUrl: string,
  studentName: string,
  rollNumber: string,
  examName: string
): Promise<string> {
  const W = 720;
  const H = 960;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // --- Clean white background ---
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // --- Thin top accent line ---
  ctx.fillStyle = '#292524';
  ctx.fillRect(0, 0, W, 4);

  // --- Header: "AAGEIS" ---
  let y = 72;
  ctx.fillStyle = '#1C1917';
  ctx.font = '500 13px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('AAGEIS', W / 2, y);
  ctx.letterSpacing = '0px';

  // --- Thin separator ---
  y += 24;
  ctx.strokeStyle = '#E5E0D8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, y);
  ctx.lineTo(W / 2 + 40, y);
  ctx.stroke();

  // --- Student Name ---
  y += 44;
  ctx.fillStyle = '#1C1917';
  ctx.font = '400 32px Georgia, "Times New Roman", serif';
  ctx.fillText(studentName, W / 2, y);

  // --- Roll & Exam ---
  y += 30;
  ctx.fillStyle = '#A8A29E';
  ctx.font = '400 13px Arial, Helvetica, sans-serif';
  ctx.fillText(`${rollNumber}  ·  ${examName}`, W / 2, y);

  // --- QR Code ---
  y += 40;
  const qrSize = 340;
  const qrX = (W - qrSize) / 2;
  const qrY = y;

  // Subtle QR container
  ctx.fillStyle = '#FAFAF9';
  roundRect(ctx, qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 16);
  ctx.fill();
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 1;
  roundRect(ctx, qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 16);
  ctx.stroke();

  // Draw QR
  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // --- "Scan to verify" ---
  y = qrY + qrSize + 56;
  ctx.fillStyle = '#A8A29E';
  ctx.font = '400 11px Arial, Helvetica, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('SCAN TO VERIFY', W / 2, y);
  ctx.letterSpacing = '0px';

  // --- Status dot + text ---
  y += 36;
  // Green dot
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(W / 2 - 52, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  // Status text
  ctx.fillStyle = '#059669';
  ctx.font = '600 12px Arial, Helvetica, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('VERIFIED', W / 2 + 4, y);
  ctx.letterSpacing = '0px';

  // --- Footer separator ---
  y += 40;
  ctx.strokeStyle = '#E5E0D8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(W - 60, y);
  ctx.stroke();

  // --- Date ---
  y += 28;
  ctx.fillStyle = '#D6D3D1';
  ctx.font = '400 10px Arial, Helvetica, sans-serif';
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  ctx.fillText(dateStr, W / 2, y);

  // --- Thin bottom accent ---
  ctx.fillStyle = '#292524';
  ctx.fillRect(0, H - 4, W, 4);

  return canvas.toDataURL('image/png');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
