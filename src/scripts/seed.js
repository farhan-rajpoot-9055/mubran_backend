import config from '../config/index.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { Settings, DEFAULT_STORE_SETTINGS } from '../models/Settings.js';
import { Category } from '../models/Category.js';

const categories = [
  {
    name: 'New Arrivals',
    description: 'Fresh from the studio — our latest designs just landed.',
    image: '',
    sortOrder: 1,
    active: true,
  },
  {
    name: '2 Piece Suits',
    description: 'Classic two-piece outfits for effortless everyday elegance.',
    image: '',
    sortOrder: 2,
    active: true,
  },
  {
    name: '3 Piece Suits',
    description: 'Complete three-piece ensembles with matching dupatta.',
    image: '',
    sortOrder: 3,
    active: true,
  },
  {
    name: 'Lawn',
    description: 'Lightweight premium lawn, perfect for summer.',
    image: '',
    sortOrder: 4,
    active: true,
  },
  {
    name: 'Cotton',
    description: 'Soft breathable cotton suits for daily comfort.',
    image: '',
    sortOrder: 5,
    active: true,
  },
  {
    name: 'Embroidered',
    description: 'Intricately embroidered pieces for special occasions.',
    image: '',
    sortOrder: 6,
    active: true,
  },
];

const seed = async () => {
  await connectDB();

  const existingAdmin = await Admin.findOne({ email: config.admin.email });
  if (!existingAdmin) {
    await Admin.create({
      name: config.admin.name,
      email: config.admin.email,
      password: config.admin.password,
      role: 'super_admin',
    });
    console.log(`✓ Admin created: ${config.admin.email}`);
  } else {
    console.log('✓ Admin already exists');
  }

  const storeSettings = { ...DEFAULT_STORE_SETTINGS };
  storeSettings.storeName = config.store.name;
  storeSettings.whatsappNumber = config.store.whatsapp;
  storeSettings.currency = config.store.currency;
  if (!storeSettings.seo.title.includes('Pakistani') && config.store.name !== 'Pakistani Ladies Suits') {
    storeSettings.seo.title = `${config.store.name} – Premium Lawn, Cotton & Embroidered`;
  }

  await Settings.findOneAndUpdate({ key: 'store' }, { data: storeSettings }, { upsert: true });
  console.log('✓ Store settings seeded');

  for (const cat of categories) {
    const existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      const { createSlug } = await import('../utils/helpers.js');
      await Category.create({ ...cat, slug: createSlug(cat.name) });
    }
  }
  console.log(`✓ Categories seeded (${categories.length})`);

  await disconnectDB();
  console.log('Seed complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});