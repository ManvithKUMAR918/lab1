-- Schema for book table
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

-- Seed initial 9 sample book records
INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
(1, 'The Pragmatic Programmer', 'Andrew Hunt & David Thomas', 550, 352),
(2, 'Clean Code', 'Robert C. Martin', 650, 464),
(3, 'JavaScript: The Good Parts', 'Douglas Crockford', 420, 176),
(4, 'Eloquent JavaScript', 'Marijn Haverbeke', 480, 472),
(5, 'You Don''t Know JS Yet', 'Kyle Simpson', 390, 142),
(6, 'Design Patterns', 'Erich Gamma et al.', 750, 395),
(7, 'Refactoring', 'Martin Fowler', 620, 448),
(8, 'Introduction to Algorithms', 'Thomas H. Cormen', 890, 1312),
(9, 'Node.js Design Patterns', 'Mario Casciaro', 580, 520);
