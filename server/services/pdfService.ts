import { extractText, getDocumentProxy } from 'unpdf';

export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MIN_EXTRACTED_TEXT_CHARS = 80;
export const MAX_EXTRACTED_TEXT_CHARS = 30000;

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  preview: string;
}

/**
 * Validates that an uploaded buffer is a real PDF within size limits
 * by checking both size and the %PDF- magic header signature.
 */
export function validatePdfBuffer(buffer: Buffer, mimeType: string, originalName: string): void {
  const lowerName = originalName.toLowerCase();
  if (!lowerName.endsWith('.pdf')) {
    throw new Error('Only PDF files (.pdf) are supported. Please upload your resume as a PDF.');
  }

  if (mimeType !== 'application/pdf' && mimeType !== 'application/x-pdf' && mimeType !== 'application/octet-stream') {
    throw new Error('Invalid file MIME type. Please upload a valid PDF document.');
  }

  if (!buffer || buffer.length === 0) {
    throw new Error('The uploaded PDF file is empty.');
  }

  if (buffer.length > MAX_PDF_SIZE_BYTES) {
    throw new Error('File exceeds the 5 MB size limit. Please upload a smaller PDF resume.');
  }

  // Verify %PDF- magic header (within first 1024 bytes per PDF spec)
  const headerSample = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('ascii');
  if (!headerSample.includes('%PDF-')) {
    throw new Error('The uploaded file does not appear to be a valid PDF document.');
  }
}

/**
 * Extracts readable plain text from a PDF buffer using unpdf.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const uint8 = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    const normalizedText = String(text ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (normalizedText.length < MIN_EXTRACTED_TEXT_CHARS) {
      throw new Error(
        'Could not extract enough readable text from this PDF. If your resume is a scanned image, please export a text-based PDF from Google Docs, Word, or LaTeX and try again.'
      );
    }

    const boundedText = normalizedText.slice(0, MAX_EXTRACTED_TEXT_CHARS);
    const preview = boundedText.slice(0, 3800);

    return {
      text: boundedText,
      pageCount: totalPages || 1,
      preview,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Could not extract enough readable text')) {
      throw error;
    }
    throw new Error(
      'Unable to read this PDF file. Please ensure it is not password-protected or corrupted.'
    );
  }
}
