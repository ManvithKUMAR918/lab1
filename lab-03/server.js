const express = require("express");
const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const databaseDirectory = path.join(__dirname, "database");
const databasePath = path.join(databaseDirectory, "books.db");
const sortableColumns = new Set(["id", "title", "author", "price", "pages"]);
const defaultBooks = [
  ["The Pragmatic Programmer", "Andrew Hunt & David Thomas", 550, 352],
  ["Clean Code", "Robert C. Martin", 650, 464],
  ["JavaScript: The Good Parts", "Douglas Crockford", 420, 176],
  ["Eloquent JavaScript", "Marijn Haverbeke", 480, 472],
  ["You Don't Know JS Yet", "Kyle Simpson", 390, 142],
  ["Design Patterns", "Erich Gamma et al.", 750, 395],
  ["Refactoring", "Martin Fowler", 620, 448],
  ["Introduction to Algorithms", "Thomas H. Cormen", 890, 1312],
  ["Node.js Design Patterns", "Mario Casciaro", 580, 520],
];

async function initializeDatabase(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      pages INTEGER
    );
  `);

  const { count } = await db.get("SELECT COUNT(*) AS count FROM book;");
  if (count === 0) {
    const insertBook = await db.prepare(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
    );
    try {
      for (const book of defaultBooks) {
        await insertBook.run(book);
      }
    } finally {
      await insertBook.finalize();
    }
  }
}

function parsePositiveInteger(value, label) {
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    return { ok: false, message: `${label} must be a positive integer.` };
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return { ok: false, message: `${label} must be a positive integer.` };
  }

  return { ok: true, value: parsed };
}

function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get(["/books", "/books/"], async (req, res, next) => {
    try {
      const {
        search_q = "",
        order_by = "id",
        order = "ASC",
        limit = "10",
        offset = "0",
        min_price: minPrice,
        max_price: maxPrice,
      } = req.query;

      if (typeof search_q !== "string") {
        return res.status(400).json({ message: "search_q must be a string." });
      }
      if (typeof order_by !== "string" || !sortableColumns.has(order_by)) {
        return res.status(400).json({
          message: "order_by must be one of: id, title, author, price, pages.",
        });
      }
      if (typeof order !== "string" || !["ASC", "DESC"].includes(order.toUpperCase())) {
        return res.status(400).json({ message: "order must be ASC or DESC." });
      }

      const parsedLimit = Number(limit);
      const parsedOffset = Number(offset);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({ message: "limit must be an integer from 1 to 100." });
      }
      if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({ message: "offset must be a non-negative integer." });
      }

      const conditions = [];
      const parameters = [];
      if (search_q) {
        conditions.push("title LIKE ?");
        parameters.push(`%${search_q}%`);
      }

      for (const [name, value] of [["min_price", minPrice], ["max_price", maxPrice]]) {
        if (value !== undefined) {
          const parsedPrice = Number(value);
          if (value === "" || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ message: `${name} must be a non-negative number.` });
          }
          conditions.push(name === "min_price" ? "price >= ?" : "price <= ?");
          parameters.push(parsedPrice);
        }
      }

      if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
        return res.status(400).json({
          message: "min_price must be less than or equal to max_price.",
        });
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const books = await db.all(
        `SELECT * FROM book ${whereClause} ORDER BY "${order_by}" ${order.toUpperCase()} LIMIT ? OFFSET ?;`,
        [...parameters, parsedLimit, parsedOffset],
      );
      return res.status(200).json(books);
    } catch (error) {
      return next(error);
    }
  });

  app.get(["/books/:bookId", "/books/:bookId/"], async (req, res, next) => {
    try {
      const parsedId = parsePositiveInteger(req.params.bookId, "Book ID");
      if (!parsedId.ok) {
        return res.status(400).json({ message: parsedId.message });
      }

      const book = await db.get("SELECT * FROM book WHERE id = ?;", [parsedId.value]);
      if (!book) {
        return res.status(404).json({ message: "Book not found." });
      }
      return res.status(200).json(book);
    } catch (error) {
      return next(error);
    }
  });

  app.post("/books", async (req, res, next) => {
    try {
      const { title, author, price, pages = null } = req.body ?? {};
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "title is required and must be a non-empty string." });
      }
      if (typeof author !== "string" || !author.trim()) {
        return res.status(400).json({ message: "author is required and must be a non-empty string." });
      }
      if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "price is required and must be a non-negative number." });
      }
      if (pages !== null && (!Number.isInteger(pages) || pages < 1)) {
        return res.status(400).json({ message: "pages must be a positive integer when provided." });
      }

      const result = await db.run(
        "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
        [title.trim(), author.trim(), price, pages],
      );
      return res.status(201).json({ message: "Book created successfully.", id: result.lastID });
    } catch (error) {
      return next(error);
    }
  });

  app.put(["/books/:bookId", "/books/:bookId/"], async (req, res, next) => {
    try {
      const parsedId = parsePositiveInteger(req.params.bookId, "Book ID");
      if (!parsedId.ok) {
        return res.status(400).json({ message: parsedId.message });
      }

      const { title, author, price, pages = null } = req.body ?? {};
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "title is required and must be a non-empty string." });
      }
      if (typeof author !== "string" || !author.trim()) {
        return res.status(400).json({ message: "author is required and must be a non-empty string." });
      }
      if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "price is required and must be a non-negative number." });
      }
      if (pages !== null && (!Number.isInteger(pages) || pages < 1)) {
        return res.status(400).json({ message: "pages must be a positive integer when provided." });
      }

      const result = await db.run(
        "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
        [title.trim(), author.trim(), price, pages, parsedId.value],
      );
      if (result.changes === 0) {
        return res.status(404).json({ message: "Book not found." });
      }
      return res.status(200).json({ message: "Book updated successfully." });
    } catch (error) {
      return next(error);
    }
  });

  app.delete(["/books/:bookId", "/books/:bookId/"], async (req, res, next) => {
    try {
      const parsedId = parsePositiveInteger(req.params.bookId, "Book ID");
      if (!parsedId.ok) {
        return res.status(400).json({ message: parsedId.message });
      }

      const result = await db.run("DELETE FROM book WHERE id = ?;", [parsedId.value]);
      if (result.changes === 0) {
        return res.status(404).json({ message: "Book not found." });
      }
      return res.status(200).json({ message: "Book deleted successfully." });
    } catch (error) {
      return next(error);
    }
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return res.status(400).json({ message: "Request body must contain valid JSON." });
    }
    console.error("Request failed:", error);
    return res.status(500).json({ message: "Internal server error." });
  });

  return app;
}

async function startServer() {
  fs.mkdirSync(databaseDirectory, { recursive: true });
  const db = await open({ filename: databasePath, driver: sqlite3.Database });
  try {
    await initializeDatabase(db);
    const port = Number(process.env.PORT) || 3000;
    const server = createApp(db).listen(port, () => {
      console.log(`Lab 3 API running at http://localhost:${port}`);
    });
    server.on("close", () => db.close());
  } catch (error) {
    await db.close();
    throw error;
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start Lab 3 API:", error);
    process.exitCode = 1;
  });
}

module.exports = { createApp, initializeDatabase };
