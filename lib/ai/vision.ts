import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini SDK. Expects GEMINI_API_KEY in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type DocumentType = 'AADHAAR' | 'SSC_MEMO' | 'HALLTICKET';

export async function validateDocumentWithVision(
  buffer: Buffer,
  mimeType: string,
  docType: DocumentType
): Promise<{ success: boolean; reason: string }> {

  if (!process.env.GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY set. Bypassing Vision verification (NOT SECURE).");
    return { success: true, reason: 'Gemini disabled in dev mode' };
  }

  // Convert buffer to base64 for Gemini payload
  const base64Data = buffer.toString('base64');
  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  const PROMPTS: Record<DocumentType, string> = {
    AADHAAR: `You are a strict forensic document examiner. Analyze this image. 
Is it a structurally valid Indian Aadhaar card (or e-Aadhaar)? 
Check for the typical visual layout, the presence of the 'Government of India' text/emblem, and the standard format of a 12-digit number XXXX XXXX XXXX.
If it is obviously a fake, hand-drawn, or a completely different document (like a picture of a dog), respond with "FAKE: <reason>". 
If it structurally matches a real Aadhaar card, respond ONLY with "VALID".`,

    SSC_MEMO: `You are a strict forensic document examiner. Analyze this image.
Is it a structurally valid Secondary School Certificate (SSC) or similar Class 10th Memorandum of Marks?
Check for typical transcript layouts, a grid of marks/grades, official board text (like "Board of Secondary Education"), and typical seals.
If it is a fake, MS Paint drawing, or completely unrelated image, respond with "FAKE: <reason>".
If it structurally matches a real SSC transcript, respond ONLY with "VALID".`,

    HALLTICKET: `You are a strict forensic document examiner. Analyze this image.
Is it a structurally valid Exam Hall Ticket or Admit Card?
Check for the presence of a student photo placeholder, a roll number, an exam center assigned, and official headings like "Hall Ticket" or "Admit Card".
If it is a fake, MS Paint drawing, or completely unrelated image, respond with "FAKE: <reason>".
If it structurally matches a real Hall Ticket, respond ONLY with "VALID".`
  };

  try {
    // Using gemini-1.5-flash as it is fast and highly capable of multimodal structured analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([PROMPTS[docType], imagePart]);
    const responseText = result.response.text().trim();

    if (responseText === 'VALID' || responseText.includes('VALID')) {
      return { success: true, reason: responseText };
    }

    return { success: false, reason: responseText };
  } catch (error: any) {
    console.error('Gemini Vision Error:', error);
    return { success: false, reason: 'AI Vision Engine failed to analyze the document.' };
  }
}
