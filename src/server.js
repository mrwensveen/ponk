require('dotenv').config();

var fs = require('fs');
var serveStatic = require('serve-static')(__dirname + '/static', { index: ['index.html'] });


var app = require('http').createServer(
  (req, res) => serveStatic(req, res, handler(req, res))
);
app.listen(process.env.PORT);

console.log('Server running on port ' + process.env.PORT);

function handler(req, res) {
  return (err) => {
    console.log(err);

    servePath(res, '/controller.html')
  };
}

function servePath(res, path) {
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
