var esprima = require('esprima');

exports.parse = function(source, callback) {
  process.nextTick(function() {
    var result;
    try {
      result = esprima.parse(source, {loc: true});
    } catch (error) {
      callback(error);
    }
    callback(null, result);
  });
};
