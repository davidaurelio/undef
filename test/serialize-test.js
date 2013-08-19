var buster = require('buster');
require('buster-more-assertions');
var format = require('util').format;

var serializeModules = require('../src/serialize').serializeModules;
var assert = buster.assert, refute = buster.refute;

function moduleToString() {
  var dependencies = this.dependencies;
  dependencies = dependencies ? format(' (%s)', dependencies.join(', ')) : '';
  return format('<module %s%s>', this.id, dependencies);
}

function unresolvableError() {
  return Error('cannot resolve module');
}

function createResolve(stub, modules) {
  stub.callsArgWith(1, unresolvableError());
  for (var i = 0, len = modules.length; i < len; i += 1) {
    var module = modules[i];
    stub.withArgs(module.id).callsArgWithAsync(1, null, module);
  }
  return stub;
}

function createModule(id, dependencies) {
  return {id: id, dependencies: dependencies, toString: moduleToString};
}

buster.testCase('serializeModules', {
  'a simple module without dependencies': {
    'should invoke the callback with an array containing the only module': function(done) {
      var entryModuleName = 'arbitrary/module';
      var entryModule = createModule(entryModuleName);
      var resolve = createResolve(this.stub(), [entryModule]);

      serializeModules([entryModuleName], resolve, done(function(error, modules) {
        refute(error);
        assert.equals(modules, [entryModule]);
      }));
    }
  },

  'two modules, one pulled in as absolute dependency': {
    'should invoke the callback with the two modules, dependency first': function(done) {
      var entryModule = createModule('entry/module', ['dependency/module']);
      var dependencyModule = createModule('dependency/module');
      var resolve = createResolve(this.stub(), [entryModule, dependencyModule]);

      serializeModules([entryModule.id], resolve, done(function(error, modules) {
        refute(error);
        assert.equals(modules, [dependencyModule, entryModule]);
      }));
    }
  },

  'more complex scenarios': {
    'A tree of dependencies without repetitions': testModules(['a'], [
      createModule('a', ['b', 'c']),
      createModule('b', ['d', 'e']),
      createModule('c', ['f', 'g']),
      createModule('d'),
      createModule('e'),
      createModule('f'),
      createModule('g')
    ]),

    'A dependency diamond': testModules(['a'], [
      createModule('a', ['b', 'c']),
      createModule('b', ['d']),
      createModule('c', ['d']),
      createModule('d')
    ]),

    'A circular dependency should resolve': function(done) {
      var nameA = 'a/b', nameB = 'c/d';
      var moduleA = createModule(nameA, [nameB]);
      var moduleB = createModule(nameB, [nameA]);
      var resolve = createResolve(this.stub(), [moduleA, moduleB]);

      serializeModules([nameA], resolve, done(function(error, modules) {
        refute(error);
        assert.equals(modules, [moduleB, moduleA]);
      }));
    },

    'An indirect circular dependency should resolve': function(done) {
      var nameA = 'a/b', nameB = 'c/d', nameC = 'e/f';
      var moduleA = createModule(nameA, [nameB]);
      var moduleB = createModule(nameB, [nameC]);
      var moduleC = createModule(nameC, [nameA]);
      var resolve = createResolve(this.stub(), [moduleA, moduleB, moduleC]);

      serializeModules([nameA], resolve, done(function(error, modules) {
        refute(error);
        assert.equals(modules, [moduleC, moduleB, moduleA]);
      }));
    }
  },

  'multiple entry modules': {
    'it should build the serialized tree correctly': testModules(['a', 'd', 'f'], [
      createModule('a', ['b', 'c']),
      createModule('b', ['j', 'k']),
      createModule('c', ['h', 'i']),
      createModule('d', ['e', 'b']),
      createModule('e', ['l', 'm']),
      createModule('f', ['g', 'c', 'b']),
      createModule('g'),
      createModule('h'),
      createModule('i'),
      createModule('j'),
      createModule('k'),
      createModule('l', ['b', 'i']),
      createModule('m')
    ])
  },

  'inexistend modules:': {
    'the callback should be invoked with an error if the entry module cannot be resolved': function(done) {
      function resolve(_, callback) {
        process.nextTick(function() {
          callback(unresolvableError());
        });
      }

      serializeModules(['inresolvable/module'], resolve, done(function(error) {
        assert(error);
      }));
    },

    'the callback should be invoked with an error if a dependency cannot be resolved': function(done) {
      var moduleA = createModule('entry/module', ['first/dependency']);
      var moduleB = createModule('first/dependency', ['missing/dependency']);
      var resolve = createResolve(this.stub(), [moduleA, moduleB]);

      serializeModules([moduleA.id], resolve, done(function(error) {
        assert(error);
      }));
    }
  },

  'relative module names': {
    'an error should be returned if the entry module is relative': function(done) {
      serializeModules(['./a/relative/id'], function() {}, done(function(error) {
        assert(error);
      }));
    },

    'an error should be returned if any dependency is relative': function(done) {
      var nameA = 'entry/module', nameB = 'a/b';
      var moduleA = createModule(nameA, [nameB]);
      var moduleB = createModule(nameB, ['../relative/dependency']);
      var resolve = createResolve(this.stub(), [moduleA, moduleB]);

      serializeModules([nameA], resolve, done(function(error) {
        assert(error);
      }));
    }
  }
});

function testModules(entryModuleNames, modules) {
  return {
    'should create a serialization that contains each module exactly once': function(done) {
      serializeModules(entryModuleNames, createResolve(this.stub(), modules), done(function(error, result) {
        refute(error);
        modules.forEach(function(module) {
          assert.containsOnce(result, module);
        });
      }));
    },
    'should contain all dependencies in the correct order': function(done) {
      serializeModules(entryModuleNames, createResolve(this.stub(), modules), done(function(error, result) {
        refute(error);
        modules.
          filter(hasDependencies).
          forEach(function(module) {
            module.dependencies.
              map(moduleById.bind(null, modules)).
              forEach(function(dependency) {
                assert.containsInOrder(result, dependency, module);
              });
          });
      }));
    }
  }
}

function hasDependencies(module) {
  return !!(module.dependencies && module.dependencies.length);
}

function moduleById(modules, id) {
  for (var module, i = 0, n = modules.length; i < n; i += 1) {
    module = modules[i];
    if (module.id === id) { return module; }
  }
}
