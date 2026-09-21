import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid resource identifier';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
    details = [{ field, message: `${field} already exists` }];
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  if (statusCode >= 500) {
    console.error('SERVER ERROR:', err);
  }

  const body = { success: false, message };
  if (details) body.details = details;
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default errorHandler;