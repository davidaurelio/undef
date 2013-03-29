exports.createResolve = createResolve;

/**
 * @param {function(string, function(Error, string))} loadFile
 * @param {function(string, function(Error, object))} parse
 * @returns {function(string, function(Error, object?)}
 */
function createResolve(loadFile, parse) {
  /**
   * @param {string} moduleId
   * @param {function(Error, object)} callback
   */
  return function(moduleId, callback) {
    loadFile(moduleId + '.js', function(error, source) {
      if (error) {
        callback(error);
      }
      else {
        parse(source, function(error, ast) {
          if (error) {
            callback(error);
          }
          else {
            callback(null, {
              name: moduleId,
              dependencies: null,
              ast: ast.body[0].expression.arguments[0]
            });
          }
        });
      }
    });
  };
}
