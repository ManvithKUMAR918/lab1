// server.js - Express Server for Lab 1
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Route 1: GET / -> Welcome message
app.get("/", (req, res) => {
  res.status(200).send("Welcome to Lab 1 Node.js and Express Server");
});

// Route 2: GET /about -> JSON containing name and section
app.get("/about", (req, res) => {
  res.status(200).json({
    name: "Manvith Kumar",
    section: "S-14"
  });
});

// Route 3: GET /time -> Current date/time using new Date()
app.get("/time", (req, res) => {
  res.status(200).send(new Date().toString());
});

// Catch-all handler for unknown paths returning 404 status
app.use((req, res) => {
  res.status(404).send("404 - Route Not Found");
});

// Start listening on port 3000
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
