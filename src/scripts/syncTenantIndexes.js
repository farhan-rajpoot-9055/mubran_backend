// Drops old single-field unique indexes (slug, sku, key) that predate
// multi-tenancy and creates the new storeId-compound ones declared in the
// models. Safe to re-run — syncIndexes() is idempotent. Run after any model
// index change:
//   node src/scripts/syncTenantIndexes.js
import '../config/index.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Settings } from '../models/Settings.js';
import { Order } from '../models/Order.js';

const MODELS = { Product, Category, Settings, Order };

const run = async () => {
  await connectDB();
  for (const [name, Model] of Object.entries(MODELS)) {
    const result = await Model.syncIndexes();
    console.log(`✓ ${name} indexes synced:`, result.length ? result : '(no changes)');
  }
  await disconnectDB();
  console.log('Index sync complete.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Index sync failed:', err.message);
  process.exit(1);
});
