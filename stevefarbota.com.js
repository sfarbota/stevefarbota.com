var express = require('express');
var app = express();

app.use(express.static(__dirname + '/httpdocs'));

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('stevefarbota.com listening at http://%s:%s', host, port);
});