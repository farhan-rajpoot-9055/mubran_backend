import app from './app.js';
import config from './config/index.js';
import { connectDB } from './config/db.js';

const bootstrap = async () => {
  await connectDB();
  const server = app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      const { disconnectDB } = await import('./config/db.js');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
    server.close(() => process.exit(1));
  });
};

bootstrap().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});