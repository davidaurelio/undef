var Q = require('q');

exports.createResolve = createResolve;

/**
 * @param {function(string, function(Error, string))} loadFile
 * @param {function(string, function(Error, object))} parse
 * @returns {function(string, function(Error, object?)}
 */
function createResolve(loadFile, parse) {
  loadFile = Q.denodeify(loadFile);
  parse = Q.denodeify(parse);

  function module(id) {
    return function(ast) {
      return {
        name: id,
        dependencies: null,
        ast: ast.body[0].expression.arguments[0]
      };
    };
  }

  /**
   * @param {string} moduleId
   * @param {function(Error, object)} callback
   */
  return function(moduleId, callback) {
    loadFile(moduleId + '.js').
      then(parse).
      then(module(moduleId)).
      nodeify(callback);
  };
}
