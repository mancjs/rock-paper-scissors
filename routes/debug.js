var express = require('express');
var database = require('../data/db');
var server = require('../game/server');
var _ = require('underscore');

var auth = express.basicAuth(function(user, pass) {
  return user === 'user' && pass === 'pass';
});

var routes = function(app) {
  app.get('/debug', auth, function(req, res) {
    return res.json(database.get());
  });

  app.get('/debug/rm/:username', auth, function(req, res) {
    var username = req.param('username');

    if (database.get()[username]) {
      delete database.get()[username];
      database.save();
    }

    return res.redirect('/debug');
  });

  app.get('/debug/drop', auth, function(req, res) {
    database.drop();
    database.save();
    return res.redirect('/debug');
  });

  app.get('/debug/registration/on', auth, function(req, res) {
    app.set('registration', 'on');
    return res.redirect('/debug');
  });

  app.get('/debug/registration/off', auth, function(req, res) {
    app.set('registration', 'off');
    return res.redirect('/debug');
  });

  app.get('/debug/play', auth, function(req, res) {
    var games = 0;

    var players = [
      { name: 'jacob', script: process.cwd() + '/bots/paper.js' },
      { name: 'matt', script: process.cwd() + '/bots/rock.js' }
    ];

    var gameFinished = function(result) {
      console.log(result);
      games++;
    };

    var allFinished = function() {
      console.log('all games finished: ' + games);
    };

    server.go(players, gameFinished, allFinished);

    return res.redirect('/debug');
  });
};

module.exports = routes;
