var fs = require('fs');
var vm = require('vm');
var _ = require('underscore');

var player = {
  console: console,
  eval: function() { return ':-)' },
  _: _
};

var startHeap = process.memoryUsage().heapTotal;
var currentHeap;
var memoryTimer;

process.on('message', function(data) {
  if (data.command === 'init') return init(data.script, data.opponent);
  if (data.command === 'play') return play();
  if (data.command === 'result') return result(data.result);
  if (data.command === 'end') return end();
});

process.on('uncaughtException', function(err) {
  raiseEvent('err', { err: err.toString() });
});

var checkMemoryUsage = function() {
  currentHeap = (process.memoryUsage().heapTotal - startHeap) / 1024 / 1024;

  if (currentHeap > 50) {
    clearInterval(memoryTimer);
    raiseEvent('memory');
  }
};

var raiseEvent = function(event, data) {
  process.send(_.extend({ event: event }, data));
};

var init = function(script, opponent) {
  vm.runInNewContext(fs.readFileSync(script, 'utf8'), player);
  player.init(opponent);
  raiseEvent('init');
};

var play = function() {
  var hand = player.play(currentHeap);
  raiseEvent('play', { hand: hand });
};

var result = function(result) {
  player.result(result);
};

var end = function() {
  player.end();
};

memoryTimer = setInterval(checkMemoryUsage, 1000);
