var app = require('http').createServer(handler);
var fs = require('fs');

require('dotenv').config();

app.listen(process.env.PORT);
console.log('Server running on port ' + process.env.PORT);

function handler(req, res) {
  if (req.method !== 'GET') return;

  if (req.url === '/') {
    serve(res, '/index.html');
  } else {
    serve(res, '/controller.html')
  }
}

function serve(res, path) {
  fs.readFile(__dirname + path,
    (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end(`Error loading ${path}`);
      }

      res.writeHead(200);
      res.end(data);
    }
  );
}
