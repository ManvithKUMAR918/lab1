// server.js - Express Server with SQLite Database and CRUD Routes (Lab 2)
// Uses Node.js built-in 'node:sqlite' module (available in Node 22+)
// For deployment on Render (Node 20), switch to the npm 'sqlite'+'sqlite3' packages.
const express = require("express");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "database", "books.db");

let db = null;

// Initialize Database Connection and start Express Server
const initializeDBAndServer = async () => {
  try {
    // 1. Open SQLite database connection
    db = new DatabaseSync(dbPath);
    console.log("Database connected successfully at:", dbPath);

    // 2. Start Express server only after DB connection succeeds
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Initialization Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// ==========================================
// CRUD ENDPOINTS
// ==========================================

// Endpoint 1: GET /books/ - Retrieve all books
app.get("/books/", async (req, res, next) => {
  try {
    const books = db.prepare("SELECT * FROM book;").all();
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

// Endpoint 2: GET /books/:bookId/ - Retrieve a single book by ID
app.get("/books/:bookId/", async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID. ID must be an integer." });
    }

    const book = db.prepare("SELECT * FROM book WHERE id = ?;").get(Number(bookId));

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

// Endpoint 3: POST /books/ - Add a new book
app.post("/books/", async (req, res, next) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate request body
    if (
      !title || typeof title !== "string" ||
      !author || typeof author !== "string" ||
      price === undefined || typeof price !== "number" || price < 0 ||
      pages === undefined || typeof pages !== "number" || pages <= 0
    ) {
      return res.status(400).json({
        error: "Invalid input. 'title' (string), 'author' (string), 'price' (number >= 0), and 'pages' (number > 0) are required."
      });
    }

    const result = db.prepare(`
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `).run(title, author, price, pages);

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      message: "Book added successfully"
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint 4: PUT /books/:bookId/ - Update an existing book by ID
app.put("/books/:bookId/", async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID. ID must be an integer." });
    }

    const { title, author, price, pages } = req.body;

    // Validate request body for full update
    if (
      !title || typeof title !== "string" ||
      !author || typeof author !== "string" ||
      price === undefined || typeof price !== "number" || price < 0 ||
      pages === undefined || typeof pages !== "number" || pages <= 0
    ) {
      return res.status(400).json({
        error: "Invalid input. 'title' (string), 'author' (string), 'price' (number >= 0), and 'pages' (number > 0) are required."
      });
    }

    // Check if the book exists first
    const existingBook = db.prepare("SELECT * FROM book WHERE id = ?;").get(Number(bookId));
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    db.prepare(`
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `).run(title, author, price, pages, Number(bookId));

    res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    next(error);
  }
});

// Endpoint 5: DELETE /books/:bookId/ - Delete a book by ID
app.delete("/books/:bookId/", async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID. ID must be an integer." });
    }

    const result = db.prepare("DELETE FROM book WHERE id = ?;").run(Number(bookId));

    if (result.changes === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});
