var child = require('child_process');
var _ = require('underscore');

var Game = function() {
  var rules = {
    'dynamite': ['rock', 'paper', 'scissors'],
    'rock':     ['scissors', 'water'],
    'scissors': ['paper', 'water'],
    'paper':    ['rock', 'water'],
    'water':    ['dynamite']
  };

  var sendCommand = function(player, command, data) {
    player.send(_.extend({ command: command }, data));
  };

  var receiveEvent = function(player, data) {
    if (data.event === 'init') player.ready = true;
    if (data.event === 'play') player.hand = data.hand;
    if (data.event === 'err') player.err = data.err;
    if (data.event === 'memory') player.memoryExceeded = true;
  };

  var loadPlayers = function(player1, player2, timeout, callback) {
    sendCommand(player1.process, 'init', { opponent: player2.name, script: player1.script });
    sendCommand(player2.process, 'init', { opponent: player1.name, script: player2.script });

    var doReadyCheck = function() {
      if (player1.err) {
        var result = {
          winner: player2.name,
          err: player1.name + ' died with: ' + player1.err,
          log: []
        };

        result[player1.name] = { w: 0, d: 0, l: 0 };
        result[player2.name] = { w: 0, d: 0, l: 0 };

        return callback(result);
      }

      if (player2.err) {
        var result = {
          winner: player1.name,
          err: player2.name + ' died with: ' + player2.err,
          log: []
        };

        result[player1.name] = { w: 0, d: 0, l: 0 };
        result[player2.name] = { w: 0, d: 0, l: 0 };

        return callback(result);
      }

      if (!player1.ready) {
        var result = {
          winner: player2.name,
          err: player1.name + ' took too long to start (> ' + timeout + 'ms)',
          log: []
        };

        result[player1.name] = { w: 0, d: 0, l: 0 };
        result[player2.name] = { w: 0, d: 0, l: 0 };

        return callback(result);
      }

      if (!player2.ready) {
        var result = {
          winner: player1.name,
          err: player2.name + ' took too long to start (> ' + timeout + 'ms)',
          log: []
        };

        result[player1.name] = { w: 0, d: 0, l: 0 };
        result[player2.name] = { w: 0, d: 0, l: 0 };

        return callback(result);
      }

      return callback();
    };

    var attempts = 20;

    var interval = setInterval(function() {
      if ((player1.ready && player2.ready) || !attempts--) {
        clearInterval(interval);
        return doReadyCheck();
      }
    }, timeout / attempts);
  };

  var play = function(player1, player2, callback) {
    var rounds = 0;
    var carryPoints = 0;
    var log = [];

    player1.dynamite = 0;
    player1.wins = 0;
    player1.draws = 0;
    player1.losses = 0;

    player2.dynamite = 0;
    player2.wins = 0;
    player2.draws = 0;
    player2.losses = 0;

    var checkDynamiteUsage = function(maxDynamite) {
      if (player1.hand === 'dynamite') {
        player1.dynamite += 1;
        player1.hand = (player1.dynamite > maxDynamite) ? '(exceeded dynamite)' : player1.hand;
      }

      if (player2.hand === 'dynamite') {
        player2.dynamite += 1;
        player2.hand = (player2.dynamite > maxDynamite) ? '(exceeded dynamite)' : player2.hand;
      }
    };

    var finishGame = function() {
      var result = {};

      if (player1.memoryExceeded) {
        result.winner = player2.name;
      } else if (player2.memoryExceeded) {
        result.winner = player1.name;
      } else if (player1.wins === player2.wins) {
        result.winner = 'draw';
      } else if (player1.wins > player2.wins) {
        result.winner = player1.name;
      } else {
        result.winner = player2.name;
      }

      result[player1.name] = { w: player1.wins, d: player1.draws, l: player1.losses };
      result[player2.name] = { w: player2.wins, d: player2.draws, l: player2.losses };
      result.log = log;

      return callback(result);
    };

    var playRound = function() {
      if (rounds >= 50) return finishGame();

      player1.err = '';
      player2.err = '';
      player1.hand = '';
      player2.hand = '';

      sendCommand(player1.process, 'play');
      sendCommand(player2.process, 'play');

      var scoreRound = function() {
        rounds += 1;

        checkDynamiteUsage(5);

        var result = score(player1, player2, carryPoints);
        carryPoints = result.draw ? (carryPoints + 1) : 0;
        log.push(result);

        if (player1.memoryExceeded || player2.memoryExceeded) return finishGame();

        sendCommand(player1.process, 'result', { result: result });
        sendCommand(player2.process, 'result', { result: result });

        playRound();
      };

      var attempts = 5;

      var interval = setInterval(function() {
        attempts--;

        if (!attempts) {
          clearInterval(interval);
          return scoreRound();
        }

        if ((player1.hand || player1.err || player1.memoryExceeded) &&
            (player2.hand || player2.err || player2.memoryExceeded)) {
          clearInterval(interval);
          return scoreRound();
        }
      }, 20);
    };

    playRound();
  };

  var score = function(player1, player2, carryPoints) {
    var log = {};
    log[player1.name] = player1.hand;
    log[player2.name] = player2.hand;

    var validHands = ['rock', 'paper', 'scissors', 'dynamite', 'water'];

    if (!_.contains(validHands, player1.hand)) {
      player1.hand = 'rock';
    }

    if (!_.contains(validHands, player2.hand)) {
      player2.hand = 'rock';
    }

    var winPoints = 1 + carryPoints;

    var exceededMemoryLimit = function(player, opponent) {
      if (player.memoryExceeded) {
        player.losses += 1;
        opponent.wins += winPoints;
        log.winner = opponent.name + ' - ' + player.name + ' exceeded memory limit';
        return true;
      }

      return false;
    };

    var playerHasErrored = function(player, opponent) {
      if (player.err) {
        player.losses += 1;
        opponent.wins += winPoints;
        log.winner = opponent.name + ' - ' + player.name + ': ' + player.err;
        return true;
      }

      return false;
    };

    if (exceededMemoryLimit(player1, player2)) return log;
    if (exceededMemoryLimit(player2, player1)) return log;

    if (playerHasErrored(player1, player2)) return log;
    if (playerHasErrored(player2, player1)) return log;

    if (player1.hand === player2.hand) {
      player1.draws += 1;
      player2.draws += 1;
      log.winner = 'draw - point carries';
      log.draw = true;
      return log;
    }

    if (player1.hand === '(exceeded dynamite)') {
      player2.wins += winPoints;
      player1.losses += 1;
      log.winner = player2.name;
      return log;
    }

    if (player2.hand === '(exceeded dynamite)') {
      player1.wins += winPoints;
      player2.losses += 1;
      log.winner = player1.name;
      return log;
    }

    if (!player1.hand) {
      player2.wins += winPoints;
      player1.losses += 1;
      log.winner = player2.name + ' - ' + player1.name + ' timed out (100ms)';
      return log;
    }

    if (!player2.hand) {
      player1.wins += winPoints;
      player2.losses += 1;
      log.winner = player1.name + ' - ' + player2.name + ' timed out (100ms)';
      return log;
    }

    if (_.contains(rules[player1.hand], player2.hand)) {
      player1.wins += winPoints;
      player2.losses += 1;
      log.winner = player1.name;
    } else {
      player2.wins += winPoints;
      player1.losses += 1;
      log.winner = player2.name;
    }

    return log;
  };

  var start = function(player1, player2, callback) {
    player1.process = child.fork(__dirname + '/player');
    player1.process.on('message', _.partial(receiveEvent, player1));
    player1.process.on('error', function() {});

    player2.process = child.fork(__dirname + '/player');
    player2.process.on('message', _.partial(receiveEvent, player2));
    player2.process.on('error', function() {});

    loadPlayers(player1, player2, 5000, function(winner) {
      if (winner) {
        player1.process.kill();
        player2.process.kill();
        return callback(winner);
      }

      play(player1, player2, function(winner) {
        player1.process.kill();
        player2.process.kill();
        return callback(winner);
      });
    });
  };

  return {
    start: start
  };
};

process.on('message', function(data) {
  if (data.command === 'play') {
    new Game().start(data.player1, data.player2, function(result) {
      process.send({ result: result });
      process.exit();
    });
  }
});
