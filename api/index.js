import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  const isHealth = req.url === '/api/health' || req.url === '/api/healthcheck';

  if (!isHealth) {
    await connectDB();
  }

  return app(req, res);
}
