import slugify from 'slugify';

export const createSlug = (text) =>
  slugify(String(text || ''), { lower: true, strict: true, trim: true });

export const stripHtml = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

export const formatPrice = (n) =>
  new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Number(n || 0));

export default createSlug;