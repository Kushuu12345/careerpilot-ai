import express from 'express';
import multer from 'multer';
import { requireFirebaseAuth, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  extractTextFromPdf,
  MAX_PDF_SIZE_BYTES,
  validatePdfBuffer,
} from '../services/pdfService.js';
import { analyzeResumeWithGemini, GeminiServiceError } from '../ai/geminiService.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PDF_SIZE_BYTES,
    files: 1,
  },
});

// Simple per-user in-memory rate limiter (max 8 analyses per 10 minutes per student)
const userRequestTimestamps = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;

function checkUserRateLimit(uid: string): boolean {
  const now = Date.now();
  const timestamps = (userRequestTimestamps.get(uid) ?? []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    userRequestTimestamps.set(uid, timestamps);
    return false;
  }
  timestamps.push(now);
  userRequestTimestamps.set(uid, timestamps);
  return true;
}

router.post(
  '/analyze',
  requireFirebaseAuth,
  (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File exceeds the 5 MB size limit. Please upload a smaller PDF.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      if (err) {
        res.status(400).json({ error: 'Failed to read uploaded file.' });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'Unauthorized request.' });
        return;
      }

      if (!checkUserRateLimit(uid)) {
        res.status(429).json({
          error: 'You have reached the temporary analysis limit (8 resumes per 10 minutes). Please wait a few minutes and try again.',
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'Please select a PDF resume file to analyze.' });
        return;
      }

      const rawTargetRole = typeof req.body?.targetRole === 'string' ? req.body.targetRole.trim() : '';
      const targetRole = (rawTargetRole || 'Software Development Engineer').slice(0, 120);
      const rawDegreeBranch = typeof req.body?.degreeBranch === 'string' ? req.body.degreeBranch.trim() : '';
      const degreeBranch = rawDegreeBranch.slice(0, 140);

      // 1. Validate PDF signature, extension, MIME type, and size
      validatePdfBuffer(file.buffer, file.mimetype, file.originalname);

      // 2. Extract readable text from PDF
      const extraction = await extractTextFromPdf(file.buffer);

      // 3. Analyze extracted text with Gemini server-side
      const analysis = await analyzeResumeWithGemini({
        resumeText: extraction.text,
        targetRole,
        degreeBranch: degreeBranch || undefined,
      });

      res.status(200).json({
        fileName: file.originalname.slice(0, 255),
        fileSizeBytes: file.size,
        pageCount: extraction.pageCount,
        targetRole,
        extractedTextPreview: extraction.preview,
        analysis,
      });
    } catch (error: unknown) {
      if (error instanceof GeminiServiceError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }

      const message = error instanceof Error ? error.message : 'An unexpected error occurred during resume analysis.';
      const isValidationError =
        message.includes('PDF') ||
        message.includes('size limit') ||
        message.includes('readable text') ||
        message.includes('empty');

      res.status(isValidationError ? 400 : 500).json({ error: message });
    }
  }
);

export default router;
