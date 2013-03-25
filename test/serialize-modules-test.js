var buster = require('buster');
var format = require('util').format;

require('./assertions').addAll(buster.assertions);
var serializeModules = require('../src/serialize-modules').serializeModules;
var assert = buster.assert, refute = buster.refute;

function moduleToString() {
  var dependencies = this.dependencies;
  dependencies = dependencies ? format(' (%s)', dependencies.join(', ')) : '';
  return format('<module %s%s>', this.name, dependencies);
}

function unresolvableError() {
  return Error('cannot resolve module');
}

function createResolve(stub, modules) {
  stub.callsArgWith(1, unresolvableError());
  for (var i = 0, len = modules.length; i < len; i += 1) {
    var module = modules[i];
    stub.withArgs(module.name).callsArgWithAsync(1, null, module);
  }
  return stub;
}

function createModule(name, dependencies) {
  return {
    type: 'module',
    dependencies: dependencies,
    name: name,
    ast: {},
    toString: moduleToString
  };
}

buster.testCase('serializeModules', {
  'a simple module without dependencies': {
    'should request the entry module from the resolve function': function(done) {
      var entryModule = 'arbitrary/module';
      var resolve = createResolve(this.stub(), [createModule(entryModule)]);

      serializeModules(entryModule, resolve, function() {
        assert.calledWith(resolve, entryModule);
        done();
      });
    },

    'should invoke the callback with an array containing the only module': function(done) {
      var entryModuleName = 'arbitrary/module';
      var entryModule = createModule(entryModuleName);
      var resolve = createResolve(this.stub(), [entryModule]);

      serializeModules(entryModuleName, resolve, function(error, modules) {
        assert.equals(modules, [entryModule]);
        done();
      });
    }
  },

  'two modules, one pulled in as absolute dependency': {
    'should request the dependency from the resolver': function(done) {
      var entryModule = createModule('entry/module', ['a/dependency']);
      var dependencyModule = createModule('a/dependency');
      var resolve = createResolve(this.stub(), [entryModule, dependencyModule]);

      serializeModules(entryModule.name, resolve, function() {
        assert.calledWith(resolve, dependencyModule.name);
        done();
      });
    },

    'should invoke the callback with the two modules, dependency first': function(done) {
      var entryModule = createModule('entry/module', ['dependency/module']);
      var dependencyModule = createModule('dependency/module');
      var resolve = createResolve(this.stub(), [entryModule, dependencyModule]);

      serializeModules(entryModule.name, resolve, function(error, modules) {
        assert.equals(modules, [dependencyModule, entryModule]);
        done();
      });
    }
  },

  'more complex scenarios': {
    'A tree of dependencies without repetitions': testModules('a', [
      createModule('a', ['b', 'c']),
      createModule('b', ['d', 'e']),
      createModule('c', ['f', 'g']),
      createModule('d'),
      createModule('e'),
      createModule('f'),
      createModule('g')
    ]),

    'A dependency diamond': testModules('a', [
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

      serializeModules(nameA, resolve, function(error, modules) {
        assert.equals(modules, [moduleB, moduleA]);
        done();
      });
    },

    'An indirect circular dependency should resolve': function(done) {
      var nameA = 'a/b', nameB = 'c/d', nameC = 'e/f';
      var moduleA = createModule(nameA, [nameB]);
      var moduleB = createModule(nameB, [nameC]);
      var moduleC = createModule(nameC, [nameA]);
      var resolve = createResolve(this.stub(), [moduleA, moduleB, moduleC]);

      serializeModules(nameA, resolve, function(error, modules) {
        assert.equals(modules, [moduleC, moduleB, moduleA]);
        done();
      });
    }
  },

  'inexistend modules:': {
    'the callback should be invoked with an error if the entry module cannot be resolved': function(done) {
      function resolve(_, callback) {
        process.nextTick(function() {
          callback(unresolvableError());
        });
      }

      serializeModules('inresolvable/module', resolve, function(error) {
        assert(error);
        done();
      });
    },

    'the callback should be invoked with an error if a dependency cannot be resolved': function(done) {
      var moduleA = createModule('entry/module', ['first/dependency']);
      var moduleB = createModule('first/dependency', ['missing/dependency']);
      var resolve = createResolve(this.stub(), [moduleA, moduleB]);

      serializeModules(moduleA.name, resolve, function(error) {
        assert(error);
        done();
      });
    }
  },

  'relative module names': {
    'an error should be returned if the entry module is relative': function(done) {
      serializeModules('./a/relative/id', function() {}, function(error) {
        assert(error);
        done();
      });
    },

    'an error should be returned if any dependency is relative': function(done) {
      var nameA = 'entry/module', nameB = 'a/b';
      var moduleA = createModule(nameA, [nameB]);
      var moduleB = createModule(nameB, ['../relative/dependency']);
      var resolve = createResolve(this.stub(), [moduleA, moduleB]);

      serializeModules(nameA, resolve, function(error) {
        assert(error);
        done();
      });
    }
  }
});

function testModules(entryModuleName, modules) {
  var modulesMap = mapFromModules(modules);

  return {
    'should create a serialization that contains each module exactly once': function(done) {
      serializeModules(entryModuleName, createResolve(this.stub(), modules), function(error, result) {
        modules.forEach(function(module) {
          assert.containsOnce(result, module);
        });
        done();
      });
    },
    'should contain all dependencies in the correct order': function(done) {
      serializeModules(entryModuleName, createResolve(this.stub(), modules), function(error, result) {
        modules
          .filter(hasDependencies)
          .forEach(function(module) {
            module.dependencies
              .map(lookup, modulesMap)
              .forEach(function(dependency) {
                assert.containsInOrder(result, dependency, module);
              });
          });
        done();
      });
    }
  }
}
function hasDependencies(module) {
  return !!(module.dependencies && module.dependencies.length);
}
function lookup(property) {
  return this[property];
}
function mapFromModules(modules) {
  return modules.reduce(function(modules, module) {
    modules[module.name] = module;
    return modules;
  }, {});
}
