import '../config/index.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Settings } from '../models/Settings.js';
import { createSlug } from '../utils/helpers.js';

const img = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const products = [
  {
    name: 'Crimson Royale Bridal Lehenga',
    sku: 'AMS-EMB-001',
    category: 'Embroidered',
    price: 38500,
    salePrice: 32900,
    stock: 6,
    featured: true,
    images: [img('1633685894176-9f715a092b79'), img('1713621181744-44c07e82f088'), img('1762201698238-bf412e297016')],
    altText: 'Bridal red and gold lehenga with intricate embroidery',
    description:
      'A regal bridal lehenga in deep crimson and gold, hand-finished with zardozi embroidery. Paired with a delicate raw-silk dupatta and matching trouser — designed for the bride who wants to feel like royalty on her most special day.',
    seo: {
      title: 'Crimson Royale Bridal Lehenga – Red & Gold Zardozi | AMS',
      description: 'Opulent red and gold bridal lehenga with hand zardozi. Premium embroidered Pakistani wear, order on WhatsApp.',
    },
  },
  {
    name: 'Emerald Breeze Lawn 3 Piece',
    sku: 'AMS-LWN-001',
    category: 'Lawn',
    price: 6499,
    salePrice: 5499,
    stock: 30,
    featured: true,
    images: [img('1773439878577-5969ffc1b198'), img('1773439877245-79b5ac3244a8')],
    altText: 'Emerald green lawn 3 piece suit with white dupatta',
    description:
      'Light-as-air premium lawn in a lush emerald print. This 3 piece set comes with an embroidered front, straight-cut trousers and a breathable dupatta — effortless elegance for everyday grace.',
    seo: {
      title: 'Emerald Breeze Lawn 3 Piece Suit – Premium Emerald | AMS',
      description: 'Premium emerald green lawn 3 piece suit with matching dupatta. Lightweight summer wear, order easily on WhatsApp.',
    },
  },
  {
    name: 'Royal Purple Chiffon 3 Piece',
    sku: 'AMS-3PC-001',
    category: '3 Piece Suits',
    price: 8999,
    salePrice: null,
    stock: 20,
    featured: true,
    images: [img('1773439878676-b0ab6febe677'), img('1773439877918-8b7253ac852e')],
    altText: 'Royal purple chiffon suit with beige dupatta',
    description:
      'A luxurious royal purple ensemble in flowing chiffon, detailed with tonal embroidery and finished with a soft beige dupatta. A graceful choice for evening gatherings and celebrations.',
    seo: {
      title: 'Royal Purple Chiffon 3 Piece Suit | AMS',
      description: 'Elegant purple chiffon 3 piece suit with tonal embroidery and beige dupatta. Order on WhatsApp.',
    },
  },
  {
    name: 'Taupe Muse Embroidered Dupatta',
    sku: 'AMS-EMB-002',
    category: 'Embroidered',
    price: 7299,
    salePrice: 6199,
    stock: 15,
    featured: false,
    images: [img('1773439878437-11da66df98e9'), img('1773439878392-74abd38c55ec')],
    altText: 'Taupe embroidered dress with pink dupatta',
    description:
      'Understated sophistication in warm taupe with delicate threadwork and a blush pink dupatta. The soft tones complement every complexion — a timeless piece you will reach for again and again.',
    seo: {
      title: 'Taupe Muse Embroidered Suit with Pink Dupatta | AMS',
      description: 'Taupe embroidered suit with blush pink dupatta. Soft, sophisticated Pakistani wear, order on WhatsApp.',
    },
  },
  {
    name: 'Sky Blue Digital Lawn Suit',
    sku: 'AMS-LWN-002',
    category: 'Lawn',
    price: 4999,
    salePrice: null,
    stock: 40,
    featured: false,
    images: [img('1773439878067-4cdadc0b1124'), img('1743229995753-69be4b438204')],
    altText: 'Sky blue embroidered lawn suit with tan shawl',
    description:
      'Cool sky-blue digital lawn with a matching tan shawl. Breezy, printed and beautifully cut — perfect for long summer days and holiday mornings.',
    seo: {
      title: 'Sky Blue Digital Lawn Suit – Summer Wear | AMS',
      description: 'Sky blue digital lawn suit with tan shawl. Lightweight premium summer fabric, order on WhatsApp.',
    },
  },
  {
    name: 'Pearl Ivory Cotton Suit',
    sku: 'AMS-COT-001',
    category: 'Cotton',
    price: 3999,
    salePrice: 3499,
    stock: 25,
    featured: false,
    images: [img('1705921266374-81743bc63a58'), img('1743229995753-69be4b438204')],
    altText: 'Pearl ivory cotton suit with classic silhouette',
    description:
      'Cloud-soft pearl ivory cotton, tailored for comfort. A classic everyday suit that drapes beautifully and stays fresh from morning to evening.',
    seo: {
      title: 'Pearl Ivory Cotton Suit | AMS',
      description: 'Soft ivory cotton suit for daily comfort. Breathable premium cotton, order on WhatsApp.',
    },
  },
  {
    name: 'Midnight Noir Embroidered Ensemble',
    sku: 'AMS-EMB-003',
    category: 'Embroidered',
    price: 10999,
    salePrice: null,
    stock: 12,
    featured: false,
    images: [img('1773439878258-3c5fa24afa75'), img('1704119142483-1269733bcedb')],
    altText: 'Black and grey embroidered ensemble',
    description:
      'Bold and modern — a black-and-grey embroidered ensemble with a striking silhouette. Statement evening wear for the confident woman who dresses to be remembered.',
    seo: {
      title: 'Midnight Noir Embroidered Ensemble | AMS',
      description: 'Black and grey embroidered evening ensemble. Premium formal Pakistani wear, order on WhatsApp.',
    },
  },
  {
    name: 'Scarlet Gold Bridal 3 Piece',
    sku: 'AMS-3PC-002',
    category: '3 Piece Suits',
    price: 42900,
    salePrice: 36500,
    stock: 8,
    featured: true,
    images: [img('1729838734093-02c250060abc'), img('1729838705348-2a67b61c640f'), img('1627205265923-190841d62452')],
    altText: 'Scarlet and gold bridal 3 piece suit',
    description:
      'A show-stopping scarlet and gold bridal set, richly embroidered for weddings, mehndi and festive evenings. Comes complete with embellished dupatta and trouser.',
    seo: {
      title: 'Scarlet Gold Bridal 3 Piece Suit | AMS',
      description: 'Scarlet and gold bridal 3 piece suit with rich embroidery. Wedding wear, order on WhatsApp.',
    },
  },
  {
    name: 'Ruby Silk 2 Piece Suit',
    sku: 'AMS-2PC-001',
    category: '2 Piece Suits',
    price: 5799,
    salePrice: null,
    stock: 18,
    featured: false,
    images: [img('1638456265353-ecfff630cfd4'), img('1762201812658-3957eeb35b37')],
    altText: 'Ruby red silk 2 piece suit',
    description:
      'Lustrous ruby silk in a graceful 2 piece silhouette. Rich colour, fluid drape and a neckline that flatters — elegance made effortless.',
    seo: {
      title: 'Ruby Silk 2 Piece Suit | AMS',
      description: 'Ruby red silk 2 piece suit with luxurious drape. Elegant festive wear, order on WhatsApp.',
    },
  },
];

const categoryImages = {
  'New Arrivals': img('1773439878258-3c5fa24afa75', 800),
  '2 Piece Suits': img('1638456265353-ecfff630cfd4', 800),
  '3 Piece Suits': img('1773439878676-b0ab6febe677', 800),
  Lawn: img('1773439878577-5969ffc1b198', 800),
  Cotton: img('1705921266374-81743bc63a58', 800),
  Embroidered: img('1773439878437-11da66df98e9', 800),
};

const seed = async () => {
  await connectDB();

  const cats = await Category.find({}).lean();
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c._id]));

  for (const p of products) {
    const catId = catByName[p.category] || null;
    const slug = createSlug(p.name);
    const data = {
      ...p,
      slug,
      category: catId,
      published: true,
    };
    await Product.findOneAndUpdate({ slug }, data, { upsert: true });
    console.log(`✓ Product: ${p.name} (${p.category})`);
  }

  for (const [catName, image] of Object.entries(categoryImages)) {
    if (catByName[catName]) {
      await Category.updateOne({ _id: catByName[catName] }, { image });
    }
  }
  console.log(`✓ Category images updated (${Object.keys(categoryImages).length})`);

  const current = await Settings.findOne({ key: 'store' });
  const data = { ...(current?.data || {}) };
  data.heroSlides = [
    {
      id: 'hero-1',
      image: img('1729838734093-02c250060abc', 1920),
      title: 'Eid & Wedding Collection 2026',
      subtitle: 'Opulent embroidered suits and luxe lawn — crafted for your most memorable moments.',
      ctaText: 'Shop the Collection',
      ctaLink: '/shop',
    },
    {
      id: 'hero-2',
      image: img('1773439878577-5969ffc1b198', 1920),
      title: 'Premium Lawn & Cotton',
      subtitle: 'Airy seasonal fabrics, handpicked and printed to perfection.',
      ctaText: 'Explore Lawn',
      ctaLink: '/category/lawn',
    },
    {
      id: 'hero-3',
      image: img('1773439878676-b0ab6febe677', 1920),
      title: 'New Season · New Arrivals',
      subtitle: 'Fresh silhouettes and elegant embellishments — be the first to wear them.',
      ctaText: 'View New Arrivals',
      ctaLink: '/category/new-arrivals',
    },
  ];
  if (!data.announcement) {
    data.announcement = 'Free nationwide delivery on orders above PKR 5,000 — order easily on WhatsApp';
  }
  await Settings.updateOne({ key: 'store' }, { $set: { data } }, { upsert: true });
  console.log('✓ Hero slides + announcement updated in store settings');

  await disconnectDB();
  console.log(`Seed complete — ${products.length} demo products.`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});