import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image provided');

  const url = `/uploads/${req.file.filename}`;

  res.status(201).json({ success: true, data: { url, filename: req.file.filename } });
});

export default { uploadImage };