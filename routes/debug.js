var express = require('express');
var database = require('../data/db');
var tournament = require('../tournament');
var _ = require('underscore');

var auth = express.basicAuth(function(user, pass) {
  return user === 'martin' && pass === '1147971058323258';
});

var routes = function(app) {
  app.get('/debug', auth, function(req, res) {
    var db = database.get();
    var result = {};

    _.each(db, function(data, username) {
      result[username] = {
        key: data.key,
        botLOC: data.botLOC,
        botUploads: data.botUploads,
        created: data.created,
        botLastUpdated: data.botLastUpdated,
        botFile: data.botFile,
        results: data.results,
        handStats: data.handStats
      };
    });

    return res.json(result);
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
    tournament.play(function() {
      return res.redirect('/debug');
    });
  });
};

module.exports = routes;
