var fs = require('fs');
exports.loadFile = function(path, callback) {
  fs.readFile(path, 'utf-8', callback);
};
