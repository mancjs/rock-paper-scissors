var hands = ['rock', 'paper', 'scissors'];

var init = function() {

};

var play = function() {
  if (Math.random() < 0.25) make.bang();
  return hands[Math.floor(Math.random() * 3)];
};

var result = function(result) {

};
