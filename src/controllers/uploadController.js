import { put } from '@vercel/blob';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { isServerless, generateFilename } from '../middlewares/upload.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image provided');

  // Serverless: multer kept the file in memory (see middlewares/upload.js) —
  // ship it to Vercel Blob so it actually persists and is servable from any
  // instance. Requires the BLOB_READ_WRITE_TOKEN env var, which Vercel sets
  // automatically once a Blob store is connected to this project.
  if (isServerless) {
    const filename = generateFilename(req.file.originalname);
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: req.file.mimetype,
    });
    return res.status(201).json({ success: true, data: { url: blob.url, filename } });
  }

  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url, filename: req.file.filename } });
});

export default { uploadImage };