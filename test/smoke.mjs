import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Admin } from '../src/models/Admin.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { Settings, DEFAULT_STORE_SETTINGS } from '../src/models/Settings.js';

let mongod;
let server;
let base;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const seed = async () => {
  await Admin.create({ name: 'Owner', email: 'admin@test.com', password: 'Admin123456!' });
  await Settings.create({ key: 'store', data: { ...DEFAULT_STORE_SETTINGS, whatsappNumber: '923001234567' } });
  const lawn = await Category.create({ name: 'Lawn', slug: 'lawn', active: true });
  await Product.create({ name: 'Summer Lawn Suit', slug: 'summer-lawn-suit', sku: 'SUM001', price: 3200, salePrice: 2800, category: lawn._id, stock: 5, published: true, featured: true });
  await Product.create({ name: 'Embroidered 3 Piece', slug: 'embroidered-3-piece', sku: 'EMB003', price: 6500, category: lawn._id, stock: 0, published: true });
  await Product.create({ name: 'Draft Product', slug: 'draft-product', sku: 'DRFT01', price: 1000, category: lawn._id, stock: 10, published: false });
};

const results = { pass: 0, fail: 0 };
const check = (name, cond, extra) => {
  if (cond) {
    results.pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    results.fail += 1;
    console.error(`  ✗ ${name}`, extra ?? '');
  }
};

const run = async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('ams_test');
  await mongoose.connect(process.env.MONGODB_URI);
  await seed();

  let ok = false;
  server = app.listen(0, () => {
    base = `http://localhost:${server.address().port}`;
    ok = true;
  });
  while (!ok) await sleep(10);

  const get = async (path, token) => {
    const r = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return { status: r.status, body: await r.json() };
  };
  const send = async (method, path, body, token) => {
    const r = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: await r.json() };
  };

  console.log('\n— Health —');
  let r = await get('/api/health');
  check('health returns ok', r.status === 200 && r.body.success);

  console.log('\n— Public products —');
  r = await get('/api/products');
  check('lists published products', r.status === 200 && r.body.data.length === 2 && r.body.pagination.total === 2);
  r = await get('/api/products?q=lawn&inStock=true');
  check('search + stock filter', r.body.data.every((p) => p.inStock === true));
  r = await get('/api/products?sort=price_asc');
  check('sort by price asc', r.body.data[0].price <= r.body.data[1].price);
  r = await get('/api/products?category=lawn&sale=true');
  check('sale filter matches discounted item', r.body.data.length === 1 && r.body.data[0].salePrice === 2800);
  r = await get('/api/products/embroidered-3-piece');
  check('product by slug', r.status === 200 && r.body.data.outOfStock === undefined);
  r = await get('/api/products/does-not-exist');
  check('404 for missing product', r.status === 404);

  console.log('\n— Related —');
  r = await get('/api/products/summer-lawn-suit/related');
  check('related products', r.status === 200 && Array.isArray(r.body.data));

  console.log('\n— Categories —');
  r = await get('/api/categories');
  check('lists active categories', r.status === 200 && r.body.data.length === 1 && r.body.data[0].productCount === 2);

  console.log('\n— Settings public —');
  r = await get('/api/settings/public');
  check('public settings', r.status === 200 && r.body.data.whatsappNumber === '923001234567' && !r.body.data.images);

  console.log('\n— Auth —');
  r = await send('POST', '/api/auth/login', { email: 'admin@test.com', password: 'wrong' });
  check('rejects bad login', r.status === 401);
  r = await send('POST', '/api/auth/login', { email: 'admin@test.com', password: 'Admin123456!' });
  check('login ok', r.status === 200 && !!r.body.token);
  const token = r.body.token;
  r = await get('/api/auth/me', token);
  check('me returns admin', r.status === 200 && r.body.admin.email === 'admin@test.com');

  console.log('\n— Admin (unauthorized) —');
  r = await get('/api/admin/dashboard');
  check('admin routes protected', r.status === 401);

  console.log('\n— Admin dashboard —');
  r = await get('/api/admin/dashboard', token);
  check('dashboard totals', r.body.data.totals.products === 3 && r.body.data.totals.published === 2);

  console.log('\n— Admin products —');
  r = await get('/api/admin/products', token);
  check('lists all products incl drafts', r.status === 200 && r.body.data.length === 3);
  r = await send('POST', '/api/admin/products', { name: 'Winter Collection', price: 4000, stock: 4, sku: 'WNT-01', published: true, category: undefined }, token);
  check('creates product with slug', r.status === 201 && r.body.data.slug === 'winter-collection');
  const newId = r.body.data._id;
  r = await send('POST', '/api/admin/products', { name: 'Dup SKU', price: 100, stock: 1, sku: 'WNT-01' }, token);
  check('duplicate SKU rejected', r.status === 409);
  r = await get('/api/admin/categories', token);
  const catId = r.body.data[0]._id;
  const pu = await send('PUT', `/api/admin/products/${newId}`, { name: 'Winter Collection 2026', sku: 'WNT-01', price: 4500, salePrice: 3999, stock: 8, category: catId, published: true, featured: true, images: ['/uploads/a.jpg'] }, token);
  check('updates product', pu.status === 200 && pu.body.data.salePrice === 3999 && pu.body.data.discountPercent === 11);
  r = await send('PATCH', `/api/admin/products/${newId}`, { published: false }, token);
  check('patch toggle publish', r.status === 200 && r.body.data.published === false);
  r = await send('DELETE', `/api/admin/products/${newId}`, null, token);
  check('deletes product', r.status === 200);

  console.log('\n— Admin categories —');
  r = await send('POST', '/api/admin/categories', { name: 'Cotton /  Cotton', active: true }, token);
  check('category slug generated', r.status === 201 && r.body.data.slug === 'cotton-cotton');
  r = await send('POST', '/api/admin/categories', { name: 'Cotton /  Cotton', active: true }, token);
  check('duplicate slug collision resolved', r.status === 201 && r.body.data.slug === 'cotton-cotton-2');
  const catToDelete = await Category.findOne({ slug: 'cotton-cotton' });
  r = await send('DELETE', `/api/admin/categories/${catToDelete._id}`, null, token);
  check('deletes category', r.status === 200);
  const lawnCat = await Category.findOne({ slug: 'lawn' });
  r = await send('DELETE', `/api/admin/categories/${lawnCat._id}`, null, token);
  check('cannot delete category in use', r.status === 409);

  console.log('\n— WhatsApp order —');
  r = await send('POST', '/api/orders/whatsapp', { name: 'Ayesha', whatsapp: '923001111222', items: [{ productId: 'invalid', sku: 'SUM001', quantity: 2 }] });
  check('order created from cart', r.status === 201 && r.body.data.order.items[0].sku === 'SUM001' && r.body.data.order.subtotal === 5600);
  r = await send('POST', '/api/orders/whatsapp', { name: 'Sana', whatsapp: '923001111222', items: [{ productId: 'invalid', sku: 'EMB003', quantity: 1 }] });
  check('out of stock order rejected', r.status === 409);

  console.log('\n— Validation & errors —');
  r = await get('/api/nope');
  check('unknown route 404', r.status === 404);
  r = await send('POST', '/api/auth/login', { email: 'not-an-email' });
  check('validation produces 422', r.status === 422);

  console.log('\n— Order records (admin) —');
  r = await get('/api/admin/orders', token);
  check('admin sees order with customer ref', r.status === 200 && r.body.data.length === 1 && r.body.data[0].customer);
  const orderId = r.body.data[0]._id;
  r = await send('PATCH', `/api/admin/orders/${orderId}`, { status: 'confirmed' }, token);
  check('update order status', r.status === 200 && r.body.data.status === 'confirmed');

  console.log('\n— Customers —');
  r = await get('/api/admin/customers', token);
  check('customer list with order stats', r.status === 200 && r.body.data[0].orderCount === 1);

  console.log('\n— Settings admin —');
  r = await send('PUT', '/api/admin/settings', { storeName: 'Elegance Suits', whatsappNumber: '923000000000', heroSlides: [{ id: 'x1', image: '/uploads/h.jpg', title: 'Hi', subtitle: 'Sub', ctaText: 'Go', ctaLink: '/shop' }] }, token);
  check('settings saved', r.status === 200 && r.body.data.storeName === 'Elegance Suits' && r.body.data.heroSlides.length === 1);

  console.log('\n' + (results.fail ? `FAILED: ${results.fail} (passed ${results.pass})` : `ALL PASSED (${results.pass})`));
};

run()
  .catch((err) => {
    console.error('SMOKE TEST ERROR:', err);
    results.fail += 1;
  })
  .finally(async () => {
    try { server?.close(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    try { await mongod?.stop(); } catch {}
    process.exit(results.fail ? 1 : 0);
  });