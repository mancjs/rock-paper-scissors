var fs = require('fs');
var vm = require('vm');
var _ = require('underscore');

var player = {
  console: console,
  eval: function(string) { },
  _: _
};

var startHeap = process.memoryUsage().heapTotal;
var currentHeap;
var memoryTimer;

process.on('message', function(data) {
  if (data.command === 'init') return init(data.script);
  if (data.command === 'play') return play();
  if (data.command === 'result') return result(data.result);
});

process.on('uncaughtException', function(err) {
  sendEvent('err', { err: err.toString() });
});

var checkMemoryUsage = function() {
  currentHeap = (process.memoryUsage().heapTotal - startHeap) / 1024 / 1024;

  if (currentHeap > 50) {
    clearInterval(memoryTimer);
    sendEvent('memory');
  }
};

var sendEvent = function(event, data) {
  process.send(_.extend({ event: event }, data));
};

var init = function(script) {
  vm.runInNewContext(fs.readFileSync(script, 'utf8'), player);
  player.init();
  sendEvent('init');
};

var play = function() {
  var hand = player.play(currentHeap);
  sendEvent('play', { hand: hand });
};

var result = function(result) {
  player.result(result);
};

memoryTimer = setInterval(checkMemoryUsage, 1000);
