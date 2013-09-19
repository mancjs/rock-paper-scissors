var http = require('http');
var express = require('express');
var mustachex = require('mustachex');

var app = express();

app.configure(function() {
  app.engine('html', mustachex.express);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.use(express.limit('200kb'));
  app.use(express.bodyParser({ uploadDir: __dirname + '/uploaded' }));
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

require('./routes/register')(app);
require('./routes/dashboard')(app);
require('./routes/results')(app);
require('./routes/debug')(app);
require('./routes/root')(app);

http.createServer(app).listen(9987);
