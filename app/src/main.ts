import http from "node:http";

const port = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown",
  );
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
