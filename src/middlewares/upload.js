import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import multer from 'multer';
import crypto from 'node:crypto';
import sanitize from 'sanitize-filename';
import { ApiError } from '../utils/ApiError.js';

// On Vercel/Lambda the filesystem is read-only except /tmp
const isServerless = !!(
  process.env.VERCEL ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);
const UPLOAD_DIR = isServerless
  ? path.join(os.tmpdir(), 'uploads')
  : path.resolve(process.cwd(), 'src/data/uploads');

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {
  // directory may already exist or filesystem may be read-only
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(sanitize(file.originalname) || '').toLowerCase() || '.jpg';
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
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