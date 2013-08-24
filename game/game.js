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
    sendCommand(player1.process, 'init', { script: player1.script });
    sendCommand(player2.process, 'init', { script: player2.script });

    var doReadyCheck = function() {
      if (!player1.ready) {
        player2.wins += 1;
        return callback({ winner: player2.name + ' - ' + player1.name + ' took to long to init' });
      }

      if (!player2.ready) {
        player1.wins += 1;
        return callback({ winner: player1.name + ' - ' + player2.name + ' took to long to init' });
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
      if (player1.draw === 'dynamite') {
        player1.dynamite += 1;
        player1.draw = (player1.dynamite > maxDynamite) ? '' : player1.draw;
      }

      if (player2.draw === 'dynamite') {
        player2.dynamite += 1;
        player2.draw = (player2.dynamite > maxDynamite) ? '' : player2.draw;
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
      if (rounds >= 100) return finishGame();

      player1.err = '';
      player2.err = '';
      player1.hand = '';
      player2.hand = '';

      sendCommand(player1.process, 'play');
      sendCommand(player2.process, 'play');

      var scoreRound = function() {
        rounds += 1;

        checkDynamiteUsage(10);
        var result = score(player1, player2);
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

  var score = function(player1, player2) {
    var log = {};
    log[player1.name] = player1.hand;
    log[player2.name] = player2.hand;

    if (player1.memoryExceeded) {
      player2.wins += 1;
      player1.losses += 1;
      log.winner = player2.name + ' - ' + player1.name + ' exceeded memory limit';
      return log;
    }

    if (player2.memoryExceeded) {
      player1.wins += 1;
      player2.losses += 1;
      log.winner = player1.name + ' - ' + player2.name + ' exceeded memory limit';
      return log;
    }

    if (player1.err) {
      player2.wins += 1;
      player1.losses += 1;
      log.winner = player2.name + ' - ' + player1.name + ': ' + player1.err;
      return log;
    }

    if (player2.err) {
      player1.wins += 1;
      player2.losses += 1;
      log.winner = player1.name + ' - ' + player2.name + ': ' + player2.err;
      return log;
    }

    if (player1.hand === player2.hand) {
      player1.draws += 1;
      player2.draws += 1;
      log.winner = 'draw';
      return log;
    }

    if (!player1.hand) {
      player2.wins += 1;
      player1.losses += 1;
      log.winner = player2.name + ' - ' + player1.name + ' default';
      return log;
    }

    if (!player2.hand) {
      player1.wins += 1;
      player2.losses += 1;
      log.winner = player1.name + ' - ' + player2.name + ' default';
      return log;
    }

    if (_.contains(rules[player1.hand], player2.hand)) {
      player1.wins += 1;
      player2.losses += 1;
      log.winner = player1.name;
    } else {
      player2.wins += 1;
      player1.losses += 1;
      log.winner = player2.name;
    }

    return log;
  };

  var start = function(player1, player2, callback) {
    player1.process = child.fork(__dirname + '/player');
    player1.process.on('message', _.partial(receiveEvent, player1));
    player1.process.on('error', function(err) {
      console.log('player1: ' + err);
    });

    player2.process = child.fork(__dirname + '/player');
    player2.process.on('message', _.partial(receiveEvent, player2));
    player2.process.on('error', function(err) {
      console.log('player2: ' + err);
    });

    loadPlayers(player1, player2, 10000, function(winner) {
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
