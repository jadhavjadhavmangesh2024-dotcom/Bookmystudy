// ============================================================
// LIBRARY ROUTES - Owner can manage library in their Abhyasika
// CRUD for Libraries, Book Categories, Books
// ============================================================
import { Hono } from 'hono';
import { authMiddleware, requireOwner, AuthUser } from '../middleware/auth';
import { successResponse, errorResponse, paginationMeta } from '../utils/helpers';

const library = new Hono<{ Bindings: { DB: D1Database } }>();

// ── Helper: verify owner of a library ────────────────────────
async function verifyLibraryOwner(db: D1Database, libraryId: string | number, userId: number, role: string) {
  if (role === 'super_admin') return { ok: true };
  const row = await db.prepare('SELECT owner_id FROM libraries WHERE id = ?').bind(libraryId).first() as any;
  if (!row) return { ok: false, notFound: true };
  if (row.owner_id !== userId) return { ok: false };
  return { ok: true };
}

// ── Helper: verify owner of an abhyasika ─────────────────────
async function verifyAbhyasikaOwner(db: D1Database, abhyasikaId: string | number, userId: number, role: string) {
  if (role === 'super_admin') return { ok: true };
  const row = await db.prepare('SELECT owner_id FROM abhyasikas WHERE id = ?').bind(abhyasikaId).first() as any;
  if (!row) return { ok: false, notFound: true };
  if (row.owner_id !== userId) return { ok: false };
  return { ok: true };
}

// ============================================================
// LIBRARY CRUD
// ============================================================

// GET /api/library/abhyasika/:abhyasikaId - Public: get library info for an abhyasika
library.get('/abhyasika/:abhyasikaId', async (c) => {
  try {
    const abhyasikaId = c.req.param('abhyasikaId');
    const db = c.env.DB;

    const lib = await db.prepare(`
      SELECT l.*, a.name as abhyasika_name,
        (SELECT COUNT(*) FROM books b WHERE b.library_id = l.id AND b.is_active = 1) as total_books,
        (SELECT COUNT(*) FROM books b WHERE b.library_id = l.id AND b.is_active = 1 AND b.available_copies > 0) as available_books,
        (SELECT COUNT(*) FROM book_categories bc WHERE bc.library_id = l.id AND bc.is_active = 1) as total_categories
      FROM libraries l
      JOIN abhyasikas a ON a.id = l.abhyasika_id
      WHERE l.abhyasika_id = ? AND l.is_active = 1
    `).bind(abhyasikaId).first();

    if (!lib) {
      return c.json(errorResponse('No library found for this abhyasika'), 404);
    }

    return c.json(successResponse(lib, 'Library details'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch library'), 500);
  }
});

// GET /api/library - Owner: list all my libraries
library.get('/', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;

    const whereClause = user.role === 'super_admin' ? '' : 'WHERE l.owner_id = ?';
    const binds = user.role === 'super_admin' ? [] : [user.id];

    const query = `
      SELECT l.*, a.name as abhyasika_name, a.address,
        (SELECT COUNT(*) FROM books b WHERE b.library_id = l.id AND b.is_active = 1) as total_books,
        (SELECT COUNT(*) FROM books b WHERE b.library_id = l.id AND b.is_active = 1 AND b.available_copies > 0) as available_books,
        (SELECT COUNT(*) FROM book_categories bc WHERE bc.library_id = l.id AND bc.is_active = 1) as total_categories
      FROM libraries l
      JOIN abhyasikas a ON a.id = l.abhyasika_id
      ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const result = binds.length
      ? await db.prepare(query).bind(...binds).all()
      : await db.prepare(query).all();

    return c.json(successResponse(result.results, 'Libraries'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch libraries'), 500);
  }
});

// POST /api/library - Owner: create library for an abhyasika
library.post('/', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;
    const body = await c.req.json();
    const { abhyasika_id, name = 'Library', description } = body;

    if (!abhyasika_id) {
      return c.json(errorResponse('abhyasika_id is required'), 400);
    }

    // Verify owner
    const ownership = await verifyAbhyasikaOwner(db, abhyasika_id, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Abhyasika not found'), 404);
      return c.json(errorResponse('You do not own this abhyasika'), 403);
    }

    // Check if library already exists
    const existing = await db.prepare('SELECT id FROM libraries WHERE abhyasika_id = ?').bind(abhyasika_id).first();
    if (existing) {
      return c.json(errorResponse('Library already exists for this abhyasika'), 409);
    }

    const result = await db.prepare(`
      INSERT INTO libraries (abhyasika_id, owner_id, name, description, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).bind(abhyasika_id, user.id, name, description || null).run();

    const library = await db.prepare('SELECT * FROM libraries WHERE id = ?').bind(result.meta.last_row_id).first();
    return c.json(successResponse(library, 'Library created successfully'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create library'), 500);
  }
});

// GET /api/library/:id - Owner: get single library detail
library.get('/:id', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, id, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    const lib = await db.prepare(`
      SELECT l.*, a.name as abhyasika_name, a.address,
        (SELECT COUNT(*) FROM books b WHERE b.library_id = l.id AND b.is_active = 1) as total_books,
        (SELECT COUNT(*) FROM books b WHERE b.library_id = l.id AND b.is_active = 1 AND b.available_copies > 0) as available_books,
        (SELECT COUNT(*) FROM book_categories bc WHERE bc.library_id = l.id AND bc.is_active = 1) as total_categories
      FROM libraries l JOIN abhyasikas a ON a.id = l.abhyasika_id
      WHERE l.id = ?
    `).bind(id).first();

    return c.json(successResponse(lib, 'Library details'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch library'), 500);
  }
});

// PUT /api/library/:id - Owner: update library
library.put('/:id', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, id, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    const body = await c.req.json();
    const { name, description, is_active } = body;

    await db.prepare(`
      UPDATE libraries SET name = COALESCE(?, name), description = COALESCE(?, description),
        is_active = COALESCE(?, is_active), updated_at = datetime('now')
      WHERE id = ?
    `).bind(name || null, description || null, is_active !== undefined ? (is_active ? 1 : 0) : null, id).run();

    const updated = await db.prepare('SELECT * FROM libraries WHERE id = ?').bind(id).first();
    return c.json(successResponse(updated, 'Library updated successfully'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update library'), 500);
  }
});

// ============================================================
// BOOK CATEGORIES CRUD
// ============================================================

// GET /api/library/:libraryId/categories - Public: list categories
library.get('/:libraryId/categories', async (c) => {
  try {
    const libraryId = c.req.param('libraryId');
    const db = c.env.DB;

    const categories = await db.prepare(`
      SELECT bc.*,
        (SELECT COUNT(*) FROM books b WHERE b.category_id = bc.id AND b.is_active = 1) as book_count
      FROM book_categories bc
      WHERE bc.library_id = ? AND bc.is_active = 1
      ORDER BY bc.name ASC
    `).bind(libraryId).all();

    return c.json(successResponse(categories.results, 'Book categories'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch categories'), 500);
  }
});

// POST /api/library/:libraryId/categories - Owner: create category
library.post('/:libraryId/categories', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const libraryId = c.req.param('libraryId');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, libraryId, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    const body = await c.req.json();
    const { name, description, color_code = '#6B7280' } = body;

    if (!name) return c.json(errorResponse('Category name is required'), 400);

    const result = await db.prepare(`
      INSERT INTO book_categories (library_id, name, description, color_code, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).bind(libraryId, name, description || null, color_code).run();

    const category = await db.prepare('SELECT * FROM book_categories WHERE id = ?').bind(result.meta.last_row_id).first();
    return c.json(successResponse(category, 'Category created successfully'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create category'), 500);
  }
});

// PUT /api/library/:libraryId/categories/:catId - Owner: update category
library.put('/:libraryId/categories/:catId', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const libraryId = c.req.param('libraryId');
    const catId = c.req.param('catId');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, libraryId, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    const body = await c.req.json();
    const { name, description, color_code, is_active } = body;

    await db.prepare(`
      UPDATE book_categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        color_code = COALESCE(?, color_code),
        is_active = COALESCE(?, is_active)
      WHERE id = ? AND library_id = ?
    `).bind(name || null, description || null, color_code || null, is_active !== undefined ? (is_active ? 1 : 0) : null, catId, libraryId).run();

    const updated = await db.prepare('SELECT * FROM book_categories WHERE id = ?').bind(catId).first();
    return c.json(successResponse(updated, 'Category updated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update category'), 500);
  }
});

// DELETE /api/library/:libraryId/categories/:catId - Owner: delete category
library.delete('/:libraryId/categories/:catId', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const libraryId = c.req.param('libraryId');
    const catId = c.req.param('catId');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, libraryId, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    // Check if books exist in this category
    const booksInCat = await db.prepare('SELECT COUNT(*) as cnt FROM books WHERE category_id = ? AND is_active = 1').bind(catId).first() as any;
    if (booksInCat && booksInCat.cnt > 0) {
      return c.json(errorResponse(`Cannot delete: ${booksInCat.cnt} books are in this category. Move or delete them first.`), 400);
    }

    await db.prepare('DELETE FROM book_categories WHERE id = ? AND library_id = ?').bind(catId, libraryId).run();
    return c.json(successResponse(null, 'Category deleted successfully'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to delete category'), 500);
  }
});

// ============================================================
// BOOKS CRUD
// ============================================================

// GET /api/library/:libraryId/books - Public: list books with filters
library.get('/:libraryId/books', async (c) => {
  try {
    const libraryId = c.req.param('libraryId');
    const db = c.env.DB;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const search = c.req.query('search') || '';
    const category_id = c.req.query('category_id') || '';
    const available_only = c.req.query('available_only') === 'true';
    const language = c.req.query('language') || '';

    let where = 'b.library_id = ? AND b.is_active = 1';
    const binds: any[] = [libraryId];

    if (search) {
      where += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)';
      binds.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category_id) { where += ' AND b.category_id = ?'; binds.push(category_id); }
    if (available_only) { where += ' AND b.available_copies > 0'; }
    if (language) { where += ' AND b.language = ?'; binds.push(language); }

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM books b WHERE ${where}`).bind(...binds).first() as any;
    const total = countResult?.total || 0;

    const books = await db.prepare(`
      SELECT b.*, bc.name as category_name, bc.color_code as category_color
      FROM books b
      LEFT JOIN book_categories bc ON bc.id = b.category_id
      WHERE ${where}
      ORDER BY b.title ASC
      LIMIT ? OFFSET ?
    `).bind(...binds, limit, offset).all();

    return c.json({
      success: true,
      message: 'Books',
      data: books.results,
      pagination: paginationMeta(page, limit, total)
    });
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch books'), 500);
  }
});

// POST /api/library/:libraryId/books - Owner: add a book
library.post('/:libraryId/books', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const libraryId = c.req.param('libraryId');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, libraryId, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    const body = await c.req.json();
    const {
      title, author, isbn, publisher, publish_year, edition,
      language = 'English', description, cover_url,
      total_copies = 1, available_copies, category_id,
      rack_number, notes, is_available = true
    } = body;

    if (!title) return c.json(errorResponse('Book title is required'), 400);

    const avail_copies = available_copies !== undefined ? available_copies : total_copies;

    const result = await db.prepare(`
      INSERT INTO books (
        library_id, category_id, title, author, isbn, publisher, publish_year,
        edition, language, description, cover_url, total_copies, available_copies,
        is_available, is_active, rack_number, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      libraryId,
      category_id || null,
      title,
      author || null,
      isbn || null,
      publisher || null,
      publish_year || null,
      edition || null,
      language,
      description || null,
      cover_url || null,
      total_copies,
      avail_copies,
      is_available ? 1 : 0,
      rack_number || null,
      notes || null
    ).run();

    // Update library total_books count
    await db.prepare(`
      UPDATE libraries SET total_books = (SELECT COUNT(*) FROM books WHERE library_id = ? AND is_active = 1),
        updated_at = datetime('now') WHERE id = ?
    `).bind(libraryId, libraryId).run();

    const book = await db.prepare(`
      SELECT b.*, bc.name as category_name FROM books b
      LEFT JOIN book_categories bc ON bc.id = b.category_id
      WHERE b.id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json(successResponse(book, 'Book added successfully'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to add book'), 500);
  }
});

// GET /api/library/:libraryId/books/:bookId - Public: get book details
library.get('/:libraryId/books/:bookId', async (c) => {
  try {
    const libraryId = c.req.param('libraryId');
    const bookId = c.req.param('bookId');
    const db = c.env.DB;

    const book = await db.prepare(`
      SELECT b.*, bc.name as category_name, bc.color_code as category_color,
        l.name as library_name, l.abhyasika_id
      FROM books b
      LEFT JOIN book_categories bc ON bc.id = b.category_id
      JOIN libraries l ON l.id = b.library_id
      WHERE b.id = ? AND b.library_id = ? AND b.is_active = 1
    `).bind(bookId, libraryId).first();

    if (!book) return c.json(errorResponse('Book not found'), 404);
    return c.json(successResponse(book, 'Book details'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch book'), 500);
  }
});

// PUT /api/library/:libraryId/books/:bookId - Owner: update book
library.put('/:libraryId/books/:bookId', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const libraryId = c.req.param('libraryId');
    const bookId = c.req.param('bookId');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, libraryId, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    const body = await c.req.json();
    const {
      title, author, isbn, publisher, publish_year, edition,
      language, description, cover_url, total_copies, available_copies,
      is_available, category_id, rack_number, notes, is_active
    } = body;

    await db.prepare(`
      UPDATE books SET
        title = COALESCE(?, title),
        author = COALESCE(?, author),
        isbn = COALESCE(?, isbn),
        publisher = COALESCE(?, publisher),
        publish_year = COALESCE(?, publish_year),
        edition = COALESCE(?, edition),
        language = COALESCE(?, language),
        description = COALESCE(?, description),
        cover_url = COALESCE(?, cover_url),
        total_copies = COALESCE(?, total_copies),
        available_copies = COALESCE(?, available_copies),
        is_available = COALESCE(?, is_available),
        category_id = COALESCE(?, category_id),
        rack_number = COALESCE(?, rack_number),
        notes = COALESCE(?, notes),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ? AND library_id = ?
    `).bind(
      title || null, author || null, isbn || null, publisher || null,
      publish_year || null, edition || null, language || null,
      description || null, cover_url || null, total_copies || null,
      available_copies !== undefined ? available_copies : null,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      category_id || null, rack_number || null, notes || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      bookId, libraryId
    ).run();

    // Update library total_books count
    await db.prepare(`
      UPDATE libraries SET total_books = (SELECT COUNT(*) FROM books WHERE library_id = ? AND is_active = 1),
        updated_at = datetime('now') WHERE id = ?
    `).bind(libraryId, libraryId).run();

    const updated = await db.prepare(`
      SELECT b.*, bc.name as category_name FROM books b
      LEFT JOIN book_categories bc ON bc.id = b.category_id WHERE b.id = ?
    `).bind(bookId).first();

    return c.json(successResponse(updated, 'Book updated successfully'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update book'), 500);
  }
});

// DELETE /api/library/:libraryId/books/:bookId - Owner: remove book
library.delete('/:libraryId/books/:bookId', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const libraryId = c.req.param('libraryId');
    const bookId = c.req.param('bookId');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, libraryId, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    await db.prepare('UPDATE books SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ? AND library_id = ?').bind(bookId, libraryId).run();

    // Update library total_books count
    await db.prepare(`
      UPDATE libraries SET total_books = (SELECT COUNT(*) FROM books WHERE library_id = ? AND is_active = 1),
        updated_at = datetime('now') WHERE id = ?
    `).bind(libraryId, libraryId).run();

    return c.json(successResponse(null, 'Book removed successfully'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to remove book'), 500);
  }
});

// GET /api/library/:libraryId/stats - Owner: library statistics
library.get('/:libraryId/stats', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const libraryId = c.req.param('libraryId');
    const db = c.env.DB;

    const ownership = await verifyLibraryOwner(db, libraryId, user.id, user.role);
    if (!ownership.ok) {
      if ((ownership as any).notFound) return c.json(errorResponse('Library not found'), 404);
      return c.json(errorResponse('Access denied'), 403);
    }

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total_books,
        SUM(available_copies) as total_available,
        SUM(total_copies) as total_copies,
        SUM(CASE WHEN available_copies = 0 THEN 1 ELSE 0 END) as fully_issued,
        COUNT(DISTINCT category_id) as categories_used,
        COUNT(DISTINCT language) as languages_count
      FROM books WHERE library_id = ? AND is_active = 1
    `).bind(libraryId).first();

    const byLanguage = await db.prepare(`
      SELECT language, COUNT(*) as count FROM books
      WHERE library_id = ? AND is_active = 1 GROUP BY language ORDER BY count DESC
    `).bind(libraryId).all();

    const byCategory = await db.prepare(`
      SELECT bc.name, bc.color_code, COUNT(b.id) as count
      FROM book_categories bc
      LEFT JOIN books b ON b.category_id = bc.id AND b.is_active = 1
      WHERE bc.library_id = ? AND bc.is_active = 1
      GROUP BY bc.id ORDER BY count DESC
    `).bind(libraryId).all();

    const recentBooks = await db.prepare(`
      SELECT b.title, b.author, b.created_at, bc.name as category_name
      FROM books b LEFT JOIN book_categories bc ON bc.id = b.category_id
      WHERE b.library_id = ? AND b.is_active = 1
      ORDER BY b.created_at DESC LIMIT 5
    `).bind(libraryId).all();

    return c.json(successResponse({
      overview: stats,
      by_language: byLanguage.results,
      by_category: byCategory.results,
      recent_books: recentBooks.results
    }, 'Library statistics'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch statistics'), 500);
  }
});

export default library;
