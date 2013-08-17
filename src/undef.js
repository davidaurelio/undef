var astToSource = require('escodegen').generate;
var partial = require('./util').partial;

var build = require('./build');
var createResolve = require('./resolve').createResolve;
var graphviz = require('./graphviz');
var idmap = require('./idmap');
var loadFile = require('./loadfile/node-fs').loadFile;
var parse = require('./parse/esprima').parse;
var prefixingLoadFile = require('./loadfile/prefixing');
var serializeModules = require('./serialize').serializeModules;

function serialize(entryModules, base, paths, callback) {
  var resolve = createResolve(prefixingLoadFile(loadFile, base, paths), parse);
  return serializeModules(entryModules, resolve, callback);
}

function job(fn, transform, callback) {
  fn(function(error, data) {
    if (!error) {
      try {
        var result = transform(data);
      } catch (e) {
        error = e;
      }
    }
    callback(error, result);
  });
}

var modulesToAst = function(modules) {
  return build(idmap(modules), modules);
};

function toAst(entryModules, base, paths, callback) {
  job(partial(serialize, [entryModules, base, paths]), modulesToAst, callback);
}

function toGraphviz(entryModules, base, paths, callback) {
  job(partial(serialize, [entryModules, base, paths]), graphviz, callback);
}

function toSource(entryModules, base, paths, callback) {
  job(partial(toAst, [entryModules, base, paths]), astToSource, callback);
}

module.exports = toSource;
module.exports.toAst = toAst;
module.exports.toGraphviz = toGraphviz;
