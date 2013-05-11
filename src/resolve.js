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

  /**
   * @param {string} moduleId
   * @param {function(Error, object)} callback
   */
  return function(moduleId, callback) {
    loadFile(moduleId + '.js').
      then(parse).
      then(partial(parseModuleAst, [moduleId])).
      nodeify(callback);
  };
}

function partial(fn, args) {
  var n = args.length;
  return function() {
    args.push.apply(args, arguments);
    var result = fn.apply(this, args);
    args.length = n;
    return result;
  }
}

function applyTo(fn, sequence) {
  for (var i = 0, n = sequence.length; i < n; i += 1) {
    sequence[i] = fn(sequence[i]);
  }
  return sequence;
}

function parseModuleAst(moduleId, astProgram) {
  var args = astProgram.body[0].expression.arguments;
  var first = args[0], second = args[1];

  var astModule, dependencies = null;
  if (first.type === 'ArrayExpression') {
    astModule = second;
    dependencies = arrayFromAst(first);
  } else {
    astModule = first;
  }
  return {
    id: moduleId,
    ast: astModule,
    dependencies: dependencies &&
      applyTo(partial(resolvePath, [moduleId]), dependencies)
  };
}

function arrayFromAst(arrayExpression) {
  return arrayExpression.elements.map(extractValue);
}

function extractValue(literal) {
  return literal.value;
}

function resolvePath(base, path) {
  var segments = path.split('/'), firstSegment = segments[0];
  if (firstSegment === '.' || firstSegment === '..') {
    segments = base.split('/').slice(0, -1).concat(segments)
  }

  var resolved = [];
  for (var segment, i = 0, n = segments.length; i < n; i++) {
    segment = segments[i];
    if (segment === '..') { resolved.pop(); }
    else if (segment !== '.') { resolved.push(segment); }
  }
  return resolved.join('/');
}
