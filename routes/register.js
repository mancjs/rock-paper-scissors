var database = require('../data/db');
var _ = require('underscore');

var invalidUsername = function(username) {
  var invalidNames = ['this', 'winner', 'won', 'w', 'lost', 'l', 'drew', 'd'];

  if (username.length > 20 || !(/^[a-zA-Z0-9_]+$/).test(username)) return true;
  if (_.contains(invalidNames, username.toLowerCase())) return true;

  return false;
};

var userExists = function(username) {
  var users = _.keys(database.get());
  return _.contains(users, username.toLowerCase());
};

var addUser = function(username) {
  var key = (Math.round(Math.random() * 100000000000)).toString(36);

  database.get()[username] = {
    key: key,
    botLOC: 0,
    botUploads: 0,
    handStats: {},
    created: new Date()
  };

  database.save();
  return key;
};

var routes = function(app) {
  app.get('/register', function(req, res) {
    return res.render('register', {
      noUsername: req.param('err') === 'nousername',
      userExists: req.param('err') === 'userexists',
      registrationOff: app.get('registration') === 'off'
    });
  });

  app.post('/register', function(req, res) {
    var username = req.body.username;

    if (app.get('registration') === 'off') return res.redirect('/register');
    if (invalidUsername(username)) return res.redirect('/register?err=nousername');
    if (userExists(username)) return res.redirect('/register?err=userexists');

    var key = addUser(username);
    res.redirect('/dashboard?username=' + username + '&key=' + key);
  });
};

module.exports = routes;
