const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { createApp, initializeDatabase } = require("./server");

let db;
let server;
let baseUrl;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lab-03-test-"));
  db = await open({
    filename: path.join(temporaryDirectory, "books.db"),
    driver: sqlite3.Database,
  });
  await initializeDatabase(db);
  server = createApp(db).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (db) {
    await db.close();
  }
  if (temporaryDirectory) {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("lists books with search, sorting, price filters, and pagination", async () => {
  const response = await fetch(
    `${baseUrl}/books?search_q=javascript&order_by=price&order=DESC&limit=5&offset=0&min_price=100&max_price=700`,
  );
  const books = await response.json();

  assert.equal(response.status, 200);
  assert.ok(books.length > 0);
  assert.ok(books.every((book) => book.title.toLowerCase().includes("javascript")));
  assert.ok(books.every((book) => book.price >= 100 && book.price <= 700));
  assert.deepEqual(
    books.map((book) => book.price),
    [...books.map((book) => book.price)].sort((left, right) => right - left),
  );
});

test("rejects unsafe sort fields and reversed price ranges with JSON messages", async () => {
  const invalidSort = await fetch(`${baseUrl}/books?order_by=unknown`);
  const invalidSortBody = await invalidSort.json();
  assert.equal(invalidSort.status, 400);
  assert.equal(typeof invalidSortBody.message, "string");

  const invalidRange = await fetch(`${baseUrl}/books?min_price=700&max_price=100`);
  const invalidRangeBody = await invalidRange.json();
  assert.equal(invalidRange.status, 400);
  assert.equal(typeof invalidRangeBody.message, "string");
});

test("creates, retrieves, updates, and deletes a book with the required statuses", async () => {
  const created = await fetch(`${baseUrl}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test Book", author: "Test Author", price: 99 }),
  });
  const createdBody = await created.json();
  assert.equal(created.status, 201);

  const fetched = await fetch(`${baseUrl}/books/${createdBody.id}`);
  assert.equal(fetched.status, 200);
  assert.equal((await fetched.json()).title, "Test Book");

  const updated = await fetch(`${baseUrl}/books/${createdBody.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated Test Book", author: "Test Author", price: 109 }),
  });
  assert.equal(updated.status, 200);

  const deleted = await fetch(`${baseUrl}/books/${createdBody.id}`, { method: "DELETE" });
  assert.equal(deleted.status, 200);

  const missing = await fetch(`${baseUrl}/books/${createdBody.id}`);
  assert.equal(missing.status, 404);
  assert.equal(typeof (await missing.json()).message, "string");
});

test("rejects incomplete or incorrectly typed create bodies with 400", async () => {
  for (const payload of [
    { author: "Test Author", price: 10 },
    { title: "Test Book", author: "Test Author", price: "10" },
  ]) {
    const response = await fetch(`${baseUrl}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).message, "string");
  }
});
