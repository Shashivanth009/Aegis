import QRCode from 'qrcode';

export async function generateStudentQRCode(studentId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = `${baseUrl}/verify/student/${studentId}`; // Front-end Examiner route

  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: {
      dark: '#292524',  // Stone dark
      light: '#F9F7F2', // Paper background
    },
  });
}

export async function generateQRCode(token: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: {
      dark: '#292524',  // Stone dark
      light: '#F9F7F2', // Paper background
    },
  });
}
