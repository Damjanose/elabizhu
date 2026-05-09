-- Product media: add optional video URL on products and a name search index.

ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products (LOWER(name));
