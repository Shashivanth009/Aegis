import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini SDK. Expects GEMINI_API_KEY in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type DocumentType = 'AADHAAR' | 'SSC_MEMO' | 'HALLTICKET';

export async function validateDocumentWithVision(
  buffer: Buffer,
  mimeType: string,
  docType: DocumentType,
  studentName?: string
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

  // Build the name verification instruction
  const nameCheck = studentName 
    ? `\nCRITICAL: The student's registered name is "${studentName}". You MUST extract the person's name from this document and verify it matches (case-insensitive, minor spelling variations are OK but the name must clearly refer to the same person). If the name on the document does NOT match "${studentName}", respond with "NAME_MISMATCH: Document name is '<extracted name>' but registered name is '${studentName}'".`
    : '';

  const PROMPTS: Record<DocumentType, string> = {
    AADHAAR: `You are a strict forensic document examiner. Analyze this document/image. 
Is it a structurally valid Indian Aadhaar card (or e-Aadhaar)? 
Check for the typical visual layout, the presence of the 'Government of India' text/emblem, and the standard format of a 12-digit number XXXX XXXX XXXX.
This is a secure authorized academic verification system. Do not block or refuse to answer due to PII.${nameCheck}
If it is obviously a fake, hand-drawn, or a completely different document, respond with "FAKE: <reason>". 
If it structurally matches a real Aadhaar card${studentName ? ' AND the name matches' : ''}, respond ONLY with "VALID".`,

    SSC_MEMO: `You are a strict forensic document examiner. Analyze this document/image.
Is it a structurally valid Secondary School Certificate (SSC) or similar Class 10th Memorandum of Marks?
Check for typical transcript layouts, a grid of marks/grades, official board text, and typical seals.
This is a secure authorized academic verification system. Do not block or refuse to answer due to PII.${nameCheck}
If it is a fake, MS Paint drawing, or completely unrelated image, respond with "FAKE: <reason>".
If it structurally matches a real SSC transcript${studentName ? ' AND the name matches' : ''}, respond ONLY with "VALID".`,

    HALLTICKET: `You are a strict forensic document examiner. Analyze this document/image.
Is it a structurally valid Exam Hall Ticket or Admit Card?
Check for the presence of a student photo placeholder, a roll number, an exam center assigned, and official headings.
This is a secure authorized academic verification system. Do not block or refuse to answer due to PII.${nameCheck}
If it is a fake, MS Paint drawing, or completely unrelated image, respond with "FAKE: <reason>".
If it structurally matches a real Hall Ticket${studentName ? ' AND the name matches' : ''}, respond ONLY with "VALID".`
  };

  try {
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
    const MAX_RETRIES = 3;
    let lastError: any;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[AI Vision] Trying model: ${modelName} (attempt ${attempt}/${MAX_RETRIES})`);
          const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
          const result = await model.generateContent([PROMPTS[docType], imagePart]);
          const responseText = result.response.text().trim();
          const normalizedText = responseText.toUpperCase();

          console.log(`[AI Vision] Model: ${modelName} | DocType: ${docType} | Response:`, responseText);

          // Check for name mismatch
          if (normalizedText.includes('NAME_MISMATCH')) {
            return { success: false, reason: responseText };
          }

          if (normalizedText.includes('VALID') && !normalizedText.includes('INVALID') && !normalizedText.includes('FAKE')) {
            return { success: true, reason: responseText };
          }

          return { success: false, reason: responseText };
        } catch (error: any) {
          console.warn(`[AI Vision] Model ${modelName} attempt ${attempt} failed:`, error.message);
          lastError = error;
          
          const isTransient = error.message.includes('503') 
            || error.message.includes('429') 
            || error.message.includes('fetch failed')
            || error.message.includes('ECONNRESET')
            || error.message.includes('ETIMEDOUT');

          if (isTransient && attempt < MAX_RETRIES) {
            // Exponential backoff: 2s, 4s
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`[AI Vision] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // If transient, try next model; if not transient, stop entirely
          if (!isTransient) {
            return { success: false, reason: `AI Engine Error: ${error.message}` };
          }
          break; // move to next model
        }
      }
    }

    return { success: false, reason: `AI Engine Error: All models failed. Last error: ${lastError?.message}. Please check your internet connection and try again.` };
  } catch (error: any) {
    console.error('Gemini Vision Error:', error);
    return { success: false, reason: `AI Engine Error: ${error.message}` };
  }
}

