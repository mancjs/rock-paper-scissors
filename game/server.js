var child = require('child_process');
var async = require('async');
var _ = require('underscore');

var buildFixtures = function(players) {
  var fixtures = [];

  _.each(players, function(p1) {
    _.each(players, function(p2) {
      if (p1 !== p2) {
        var duplicate = _.some(fixtures, function(fixture) {
          return (p1 === fixture[0] && p2 === fixture[1])
              || (p1 === fixture[1] && p2 === fixture[0]);
        });

        if (!duplicate) fixtures.push([p1, p2]);
      }
    });
  });

  return fixtures;
};

var go = function(players, onGameComplete, onFinished) {
  var fixtures = buildFixtures(players);

  var queue = async.queue(function(fixture, callback) {
    var game = child.fork(__dirname + '/game');

    var command = {
      command: 'play',
      player1: fixture[0],
      player2: fixture[1]
    };

    game.send(command);

    game.on('message', function(data) {
      onGameComplete(command.player1, command.player2, data.result);
      callback();
    });
  }, 40);

  queue.push(fixtures);
  queue.drain = onFinished;
};

module.exports = {
  go: go
};
