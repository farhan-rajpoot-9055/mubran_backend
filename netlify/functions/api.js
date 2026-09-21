import serverless from 'serverless-http';
import app from '../../src/app.js';
import { connectDB } from '../../src/config/db.js';

const serverlessApp = serverless(app);

export const handler = async (event, context) => {
  const path = event.path || '';
  const isHealth = path === '/api/health' || path === '/api/healthcheck';

  if (!isHealth) {
    await connectDB();
  }

  return serverlessApp(event, context);
};
