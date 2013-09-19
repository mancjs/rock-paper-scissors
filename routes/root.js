var tournament = require('../tournament');
var _ = require('underscore');

var routes = function(app) {
  app.get('/', function(req, res) {
    return res.render('root');
  });
};

module.exports = routes;
