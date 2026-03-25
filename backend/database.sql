-- АндСофт Админ Panel - PostgreSQL Database Schema
-- Render.com compatible (PostgreSQL 15+)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT 'Админ',
  login VARCHAR(100) NOT NULL UNIQUE,
  pass VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'super',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  avatar TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sound_enabled SMALLINT NOT NULL DEFAULT 1,
  auto_refresh SMALLINT NOT NULL DEFAULT 1,
  sidebar_collapsed SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sidebar (
  id SERIAL PRIMARY KEY,
  logo TEXT DEFAULT NULL,
  logo_light TEXT DEFAULT NULL,
  subtitle VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT '',
  address VARCHAR(500) DEFAULT '',
  facebook VARCHAR(500) DEFAULT '',
  instagram VARCHAR(500) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS about (
  id SERIAL PRIMARY KEY,
  "text" TEXT DEFAULT NULL,
  mission TEXT DEFAULT NULL,
  vision TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS contact (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT '',
  lat VARCHAR(50) DEFAULT '',
  lng VARCHAR(50) DEFAULT '',
  zoom INTEGER DEFAULT 17,
  popup_title VARCHAR(255) DEFAULT '',
  popup_address VARCHAR(500) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  icon TEXT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team (
  id SERIAL PRIMARY KEY,
  role VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT DEFAULT NULL,
  url VARCHAR(500) DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES pricing_categories(id) ON DELETE CASCADE,
  icon TEXT DEFAULT '',
  title VARCHAR(255) NOT NULL,
  price VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT NULL,
  popular SMALLINT DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon TEXT DEFAULT '',
  price VARCHAR(255) DEFAULT '',
  popular SMALLINT DEFAULT 0,
  features TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS advantage_sections (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) DEFAULT '01',
  title VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS advantage_items (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES advantage_sections(id) ON DELETE CASCADE,
  icon TEXT DEFAULT '',
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_desc VARCHAR(500) DEFAULT '',
  description TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  category VARCHAR(20) DEFAULT 'project',
  tags VARCHAR(500) DEFAULT '',
  price VARCHAR(255) DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT '',
  message TEXT NOT NULL,
  service VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT '',
  project VARCHAR(255) DEFAULT '',
  message TEXT DEFAULT NULL,
  service VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  "text" VARCHAR(500) NOT NULL,
  is_read SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  admin_name VARCHAR(100) DEFAULT '',
  action VARCHAR(20) NOT NULL,
  section VARCHAR(100) NOT NULL,
  item VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: andsoft123)
INSERT INTO users (name, login, pass, role, status)
VALUES ('Админ', 'admin', '$2y$10$defaulthashplaceholder', 'super', 'active')
ON CONFLICT (login) DO NOTHING;

-- Insert default sidebar
INSERT INTO sidebar (id, subtitle, email, phone, address)
VALUES (1, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert default about
INSERT INTO about (id, "text", mission, vision)
VALUES (1, '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert default contact
INSERT INTO contact (id, email, phone, lat, lng, zoom, popup_title, popup_address)
VALUES (1, '', '', '', '', 17, '', '')
ON CONFLICT (id) DO NOTHING;
