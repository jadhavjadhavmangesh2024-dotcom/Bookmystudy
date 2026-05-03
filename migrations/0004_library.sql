-- ============================================================
-- Migration 0004: Library Management System
-- Owner can add a library to their abhyasika
-- Manage book categories and books
-- ============================================================

-- Libraries table: one library per abhyasika
CREATE TABLE IF NOT EXISTS libraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL UNIQUE,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT 'Library',
  description TEXT,
  is_active INTEGER DEFAULT 1,
  total_books INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Book categories table
CREATE TABLE IF NOT EXISTS book_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#6B7280',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id INTEGER NOT NULL,
  category_id INTEGER,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  publisher TEXT,
  publish_year INTEGER,
  edition TEXT,
  language TEXT DEFAULT 'English',
  description TEXT,
  cover_url TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  is_available INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  rack_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES book_categories(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_libraries_abhyasika ON libraries(abhyasika_id);
CREATE INDEX IF NOT EXISTS idx_libraries_owner ON libraries(owner_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_library ON book_categories(library_id);
CREATE INDEX IF NOT EXISTS idx_books_library ON books(library_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
