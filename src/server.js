require('dotenv').config();

const fs = require('fs');
const path = require('path');
const serveStatic = require('serve-static')(`${__dirname}/static`, { index: ['index.html'] });
const app = require('http').createServer(
  (req, res) => serveStatic(req, res, handler(req, res)),
);

app.listen(process.env.PORT);

console.log(`Server running on port ${process.env.PORT}`);

function handler(_req, res) {
  return () => {
    servePath(res, '/controller.html');
  };
}

function servePath(res, filePath) {
  fs.readFile(
    path.join(__dirname, filePath),
    (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end(`Error loading ${filePath}`);
      }

      res.writeHead(200);
      return res.end(data);
    },
  );
}
