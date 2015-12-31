//var http = require('http');
//var express = require('express');
//http.createServer(function (request, response){
  ////response.writeHead(200, {'Content-Type': 'text/plain'});
  ////response.end('Hello, World!\n');
  //app.use(express.static('/var/www/html/stevefarbota.com'));
//}).listen(8080, 'localhost');
//console.log('Server running at http://localhost:8080/');

var express = require('express');
var app = express();

//app.get('/', function (req, res) {
//  res.send('Hello World!');
//});

app.use(express.static(__dirname + '/httpdocs'));

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});