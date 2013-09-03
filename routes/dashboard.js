var fs = require('fs');
var database = require('../data/db');
var moment = require('moment');
var _ = require('underscore');

var countSignificantLines = function(file) {
  var data = fs.readFileSync(file, 'utf8');
  return _.without(data.split('\n'), '').length;
};

var countPlayers = function() {
  var db = database.get();

  return _.countBy(_.keys(db), function(user) {
    return db[user].botFile !== undefined;
  }).true || 1;
};

var routes = function(app) {
  app.get('/dashboard', function(req, res) {
    var model = {
      username: req.param('username'),
      key: req.param('key')
    };

    if (!database.get()[model.username] || database.get()[model.username].key !== model.key) {
      return res.redirect('/register');
    }

    var data = database.get()[model.username];

    model.playerCount = countPlayers() - 1;
    model.botLastUpdated = data.botLastUpdated ? moment(data.botLastUpdated).from(new Date) : 'never';
    model.botUploads = data.botUploads;
    model.botLOC = data.botLOC;
    model.results = data.results || { won: 0, lost: 0, drew: 0 };

    return res.render('dashboard', model);
  });

  app.post('/update', function(req, res) {
    var username = req.body.username;
    var key = req.body.key;
    var file = req.files['bot'];

    if (!database.get()[username] || database.get()[username].key !== key) {
      return res.redirect('/register');
    }

    if (file) {
      database.get()[username].botLastUpdated = new Date;
      database.get()[username].botUploads += 1;
      database.get()[username].botLOC = countSignificantLines(file.path);
      database.get()[username].botFile = file.path;
      database.save();
    }

    return res.redirect('/dashboard?username=' + username + '&key=' + key);
  });
};

module.exports = routes;
