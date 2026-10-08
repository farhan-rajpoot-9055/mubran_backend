import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import crypto from 'node:crypto';
import sanitize from 'sanitize-filename';
import { ApiError } from '../utils/ApiError.js';

// On Vercel/Lambda the filesystem is read-only AND ephemeral per-instance —
// a file written to disk (even /tmp) by one invocation is not visible to
// the instance that serves a later request for it. So in serverless we
// never touch disk at all: multer keeps the upload in memory and
// uploadController.js ships the buffer straight to Vercel Blob storage,
// which is what actually persists it. Local/non-serverless dev keeps the
// original "save to disk, serve via express.static" path untouched.
export const isServerless = !!(
  process.env.VERCEL ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

const UPLOAD_DIR = path.resolve(process.cwd(), 'src/data/uploads');

if (!isServerless) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch {
    // directory may already exist
  }
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_SIZE = 5 * 1024 * 1024;

export const generateFilename = (originalname) => {
  const ext = path.extname(sanitize(originalname) || '').toLowerCase() || '.jpg';
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
};

const storage = isServerless
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
    });

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPG, PNG, WEBP, GIF or AVIF images are allowed'));
    }
    cb(null, true);
  },
});

export const UPLOAD_PATH = '/uploads';
export const uploadDir = UPLOAD_DIR;
export default upload;