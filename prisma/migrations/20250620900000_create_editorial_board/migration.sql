CREATE TABLE editorial_board_categories (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE editorial_board_members (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES editorial_board_categories(_id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  designation VARCHAR(500) NOT NULL DEFAULT '',
  affiliation TEXT NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX editorial_board_members_category_id_idx ON editorial_board_members (category_id);
CREATE INDEX editorial_board_categories_sort_order_idx ON editorial_board_categories (sort_order);
