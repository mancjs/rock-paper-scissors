var fs = require('fs');

var dataPath = __dirname + '/database.json';

var database = {

};

var get = function() {
  return database;
};

var save = function() {
  fs.writeFileSync(dataPath, JSON.stringify(database));
};

var load = function() {
  if (fs.existsSync(dataPath)) {
    database = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
};

var drop = function() {
  database = {};
};

load();

module.exports = {
  get: get,
  save: save,
  drop: drop
};
