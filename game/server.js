var child = require('child_process');
var async = require('async');
var _ = require('underscore');

var players = [
  { name: 'jacob', script: process.cwd() + '/bots/paper.js' },
  { name: 'matt', script: process.cwd() + '/bots/paper.js' },
  { name: 'smith', script: process.cwd() + '/bots/paper.js' },
  { name: 'fred', script: process.cwd() + '/bots/paper.js' },
  { name: 'will', script: process.cwd() + '/bots/paper.js' },
  { name: 'mae1', script: process.cwd() + '/bots/random-dynamite.js' },
  { name: 'mae2', script: process.cwd() + '/bots/random.js' },
  { name: 'mae3', script: process.cwd() + '/bots/random-water.js' },
  { name: 'mae4', script: process.cwd() + '/bots/paper.js' },
  { name: 'mae5', script: process.cwd() + '/bots/random-dynamite.js' },
  { name: 'mae6', script: process.cwd() + '/bots/scissors.js' },
  { name: 'mae7', script: process.cwd() + '/bots/rock.js' },
  { name: 'mae8', script: process.cwd() + '/bots/random-water.js' },
  { name: 'mae9', script: process.cwd() + '/bots/random-dynamite.js' },
  { name: 'mae10', script: process.cwd() + '/bots/random.js' }
];

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

var go = function(onGameComplete, onFinished) {
  var fixtures = buildFixtures(players);

  var queue = async.queue(function(fixture, callback) {
    var game = child.fork(__dirname + '/game');

    game.send({
      command: 'play',
      player1: fixture[0],
      player2: fixture[1]
    });

    game.on('message', function(data) {
      onGameComplete(data.result);
      callback();
    });
  }, 50);

  queue.push(fixtures);
  queue.drain = onFinished;
};

module.exports = {
  go: go
};
