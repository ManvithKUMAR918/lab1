// server-http.js - Plain Node.js HTTP Server using built-in http module
const http = require("http");

const PORT = 3000;

// Create server using http.createServer
const server = http.createServer((req, res) => {
  // Set HTTP status code 200 and Content-Type header
  res.writeHead(200, { "Content-Type": "text/plain" });
  // Send "Hello" response
  res.end("Hello");
});

// Start listening on port 3000
server.listen(PORT, () => {
  console.log(`Plain HTTP Server running on http://localhost:${PORT}`);
});
