var Q = require('q');
var util = require('./util');
var keypath = util.keypath;
var partial = util.partial;

exports.createResolve = createResolve;

/**
 * @param {function(string, function(Error, string))} loadFile
 * @param {function(string, function(Error, object))} parse
 * @returns {function(string, function(Error, object?)}
 */
function createResolve(loadFile, parse) {
  loadFile = Q.denodeify(loadFile);
  parse = Q.denodeify(parse);

  function parseSource(source) {
    return parse(source).then(function(ast) {
      return [ast, source];
    })
  }

  /**
   * @param {string} moduleId
   * @param {function(Error, object)} callback
   */
  return function(moduleId, callback) {
    loadFile(moduleId + '.js').
      then(parseSource).
      spread(partial(parseModuleAst, [moduleId])).
      nodeify(callback);
  };
}

function applyTo(fn, sequence) {
  for (var i = 0, n = sequence.length; i < n; i += 1) {
    sequence[i] = fn(sequence[i]);
  }
  return sequence;
}

function parseModuleAst(moduleId, astProgram, source) {
  var firstStatement = astProgram.body[0];
  if (firstStatement.type !== 'ExpressionStatement') {
    var location = moduleId;
    var line = keypath(firstStatement, 'loc', 'start', 'line');
    var column = keypath(firstStatement, 'loc', 'start', 'column');
    if (line) {
      location += ':' + line;
      if (column) {
        location += source.split(/\r?\n/)[line - 1].slice(column, 30);
      }
    }

    throw TypeError('Unexpected input in module ' + location);
  }

  var args = firstStatement.expression.arguments;
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
