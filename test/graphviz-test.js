var buster = require('buster');

var graphviz = require('../src/graphviz');
var assert = buster.assert;

function module(id, dependencies) {
  return { id: id, dependencies: dependencies };
}

function flatten(array) {
  return Array.prototype.concat.apply(Array.prototype, array);
}

buster.testCase('graphviz', {
  'produces a valid strict digraph': function() {
    var output = graphviz([]);
    assert.match(output, /^strict digraph (?:"[^"]+" )?\{$/m);
    assert.match(output, /^\}$/m);
  },

  'lists all dependencies in the digraph': function() {
    var module1 = module('a/b/c', ['d/e', 'f']);
    var module2 = module('d/e', ['f', 'g/h']);
    var module3 = module('f');
    var module4 = module('g/h', ['f']);

    var modules = [module1, module2, module3, module4];
    var edges = flatten(modules.map(function(module) {
      var dependencies = module.dependencies, id = JSON.stringify(module.id);
      return dependencies ?
        dependencies.map(function(dependency) {
          return id + ' -> ' + JSON.stringify(dependency) + ';';
        }) :
        [];
     }));

    var lines = graphviz(modules).split('\n').slice(1, -1);
    assert.equals(lines.sort(), edges.sort());
  }
});
