var database = require('../data/db');
var _ = require('underscore');

var routes = function(app) {
  app.get('/results', function(req, res) {
    return res.render('results');
  });
};

module.exports = routes;
