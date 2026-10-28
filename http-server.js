// Plain Node.js server using the built-in http module
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello");
});

server.listen(3000, () => {
  console.log("http server running on http://localhost:3000");
});
