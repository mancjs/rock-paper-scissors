var hands = ['rock', 'paper', 'scissors', 'dynamite'];
var dynamite = 0;

var init = function() {

};

var play = function(memoryUsage) {
  var hand = hands[Math.floor(Math.random() * 4)];

  if (hand === 'dynamite') {
    dynamite++;
    if (dynamite > 10) return play(memoryUsage);
  }

  return hand;
};

var result = function(result) {

};
