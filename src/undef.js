var escodegen = require('escodegen');
var build = require('./build');
var createResolve = require('./resolve').createResolve;
var loadFile = require('./loadfile/node-fs').loadFile;
var idmap = require('./idmap');
var parse = require('./parse/esprima').parse;
var prefixingLoadFile = require('./loadfile/prefixing');
var serializeModules = require('./serialize').serializeModules;

function toAst(entryModules, base, paths, callback) {
  var resolve = createResolve(prefixingLoadFile(loadFile, base, paths), parse);
  serializeModules(entryModules, resolve, function(error, modules) {
    var ast;
    if (!error) {
      try {
        ast = build(idmap(modules), modules);
      } catch (e) {
        error = e;
      }
    }
    callback(error, ast);
  });
}

function toSource(entryModules, base, paths, callback) {
  toAst(entryModules, base, paths, function(error, ast) {
    var source;
    if (!error) {
      try {
        source = escodegen.generate(ast);
      } catch (e) {
        error = e;
      }
    }
    callback(error, source);
  });
}

module.exports = toSource;
module.exports.toAst = toAst;
