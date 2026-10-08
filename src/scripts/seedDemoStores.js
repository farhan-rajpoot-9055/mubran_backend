// Dev-only demo data for the multi-tenant proof-of-concept slice.
// Creates two Store docs and a few Products under each, so
// GET /api/stores/ayesha/products and GET /api/stores/fatima/products
// return visibly different, isolated catalogs. Run with:
//   node src/scripts/seedDemoStores.js
import '../config/index.js'; // triggers dotenv.config() so MONGODB_URI is loaded
import { connectDB, disconnectDB } from '../config/db.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { createSlug } from '../utils/helpers.js';

const STORES = [
  {
    name: 'Ayesha Couture House',
    slug: 'ayesha',
    products: [
      { name: 'Ayesha Embroidered Lawn Suit', sku: 'AYE-001', price: 6500 },
      { name: 'Ayesha Silk Party Wear', sku: 'AYE-002', price: 12000, salePrice: 9800 },
      { name: 'Ayesha Cotton Casual Set', sku: 'AYE-003', price: 3200 },
    ],
  },
  {
    name: 'Fatima Boutique',
    slug: 'fatima',
    products: [
      { name: 'Fatima Bridal Maxi', sku: 'FAT-001', price: 25000 },
      { name: 'Fatima Everyday Linen', sku: 'FAT-002', price: 2800 },
    ],
  },
];

const seedDemoStores = async () => {
  await connectDB();

  for (const s of STORES) {
    const store = await Store.findOneAndUpdate(
      { slug: s.slug },
      { name: s.name, slug: s.slug, status: 'active' },
      { upsert: true, new: true }
    );
    console.log(`✓ Store ready: ${store.name} (/${store.slug})`);

    for (const p of s.products) {
      const slug = createSlug(p.name);
      await Product.findOneAndUpdate(
        { storeId: store._id, sku: p.sku },
        {
          storeId: store._id,
          name: p.name,
          slug,
          sku: p.sku,
          price: p.price,
          salePrice: p.salePrice ?? null,
          stock: 20,
          published: true,
        },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ ${s.products.length} product(s) seeded for ${store.slug}`);
  }

  await disconnectDB();
  console.log('Demo store seed complete.');
  process.exit(0);
};

seedDemoStores().catch((err) => {
  console.error('Demo store seed failed:', err.message);
  process.exit(1);
});
