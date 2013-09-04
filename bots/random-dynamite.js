var hands = ['rock', 'paper', 'scissors', 'dynamite'];
var dynamite = 0;

var init = function() {
  while(true){ }
};

var play = function(memoryUsage) {
  var hand = hands[Math.floor(Math.random() * 4)];

  //console.log('mem: ' + memoryUsage);

  if (hand === 'dynamite') {
    dynamite++;
    if (dynamite > 10) return play(memoryUsage);
  }

  //while(true){}

  return hand;
};

var result = function(result) {
  //console.log('res: ' + result);
};
