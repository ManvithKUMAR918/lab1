// Same server rewritten with Express
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome to my Express server!");
});

app.get("/about", (req, res) => {
  res.json({ name: "Manvith", section: "YOUR_SECTION" });
});

app.get("/time", (req, res) => {
  res.send(new Date().toString());
});

// 404 handler: must come AFTER all routes
app.use((req, res) => {
  res.status(404).send("404 - Route not found");
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
