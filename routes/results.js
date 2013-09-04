var tournament = require('../tournament');
var _ = require('underscore');

var routes = function(app) {
  app.get('/results', function(req, res) {
    var results = tournament.getResults();
    return res.render('results', { results: results });
  });
};

module.exports = routes;
