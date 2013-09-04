var database = require('./data/db');
var server = require('./game/server');
var _ = require('underscore');

var getPlayers = function() {
  var db = database.get();
  var usernames = _.keys(db);

  var players = _.map(usernames, function(username) {
    if (db[username].botFile) return {
      name: username,
      script: db[username].botFile
    };
  });

  return _.without(players, undefined);
};

var play = function(callback) {
  var db = database.get();

  var resetScores = function() {
    _.each(db, function(user) {
      user.results = { won: 0, lost: 0, drew: 0 };
      user.history = {};
      user.handStats = {};
    });
  };

  var gameFinished = function(player1, player2, result) {
    if (result.winner === player1.name) {
      db[player1.name].results.won += 1;
      db[player2.name].results.lost += 1;
    }

    if (result.winner === player2.name) {
      db[player1.name].results.lost += 1;
      db[player2.name].results.won += 1;
    }

    if (result.winner === 'draw') {
      db[player1.name].results.drew += 1;
      db[player2.name].results.drew += 1;
    }

    db[player1.name].history[player2.name] = {
      youWon: result.winner === player1.name,
      youDrew: result.winner === 'draw',
      you: result[player1.name],
      opponent: result[player2.name],
      handsPlayed: result.log.length,
      hands: result.log,
      err: result.err
    };

    db[player2.name].history[player1.name] = {
      youWon: result.winner === player2.name,
      youDrew: result.winner === 'draw',
      you: result[player2.name],
      opponent: result[player1.name],
      handsPlayed: result.log.length,
      hands: result.log,
      err: result.err
    };

    var countHands = function(logs, player, hand) {
      return _.filter(logs, function(log) {
        return log[player] === hand;
      }).length;
    };

    db[player1.name].handStats[player2.name] = {
      rock: countHands(result.log, player2.name, 'rock'),
      paper: countHands(result.log, player2.name, 'paper'),
      scissors: countHands(result.log, player2.name, 'scissors'),
      dynamite: countHands(result.log, player2.name, 'dynamite') + countHands(result.log, player2.name, '(exceeded dynamite)'),
      water: countHands(result.log, player2.name, 'water'),
      errors: countHands(result.log, player2.name, '')
    };

    db[player2.name].handStats[player1.name] = {
      rock: countHands(result.log, player1.name, 'rock'),
      paper: countHands(result.log, player1.name, 'paper'),
      scissors: countHands(result.log, player1.name, 'scissors'),
      dynamite: countHands(result.log, player1.name, 'dynamite') + countHands(result.log, player1.name, '(exceeded dynamite)'),
      water: countHands(result.log, player1.name, 'water'),
      errors: countHands(result.log, player1.name, '')
    };
  };

  resetScores();

  server.go(getPlayers(), gameFinished, function() {
    database.save();
    console.log('Tournament finished');
    return callback();
  });
};

var getResults = function() {
  var db = database.get();

  var results = _.map(db, function(data, username) {
    if (data.results) return {
      username: username,
      won: data.results.won,
      lost: data.results.lost,
      drew: data.results.drew,
      score: parseInt(data.results.won.toString() + data.results.drew.toString(), 10)
    }
  });

  results = _.without(results, undefined);

  var sortedResults = _.sortBy(results, 'score').reverse();

  _.each(sortedResults, function(result, index) {
    result.position = index + 1;
  });

  return sortedResults;
};

module.exports = {
  play: play,
  getResults: getResults
};
