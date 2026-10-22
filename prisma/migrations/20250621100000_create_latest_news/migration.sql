CREATE TABLE latest_news (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  excerpt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  published_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX latest_news_published_at_idx ON latest_news (published_at DESC);
CREATE INDEX latest_news_sort_order_idx ON latest_news (sort_order);
