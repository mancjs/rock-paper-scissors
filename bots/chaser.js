var opponent;
var nextHand = 'paper';

var init = function(o) {
  opponent = o;
};

var play = function() {
  return nextHand;
};

var result = function(result) {
  nextHand = result[opponent];
};
