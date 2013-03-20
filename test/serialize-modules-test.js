var buster = require('buster');
var format = require('util').format;

require('./assertions').addAll(buster.assertions);
var serializeModules = require('../src/serialize-modules').serializeModules;

function moduleToString() {
  var dependencies = this.dependencies;
  dependencies = dependencies ? format(' (%s)', dependencies.join(', ')) : '';
  return format('<module %s%s>', this.name, dependencies);
}

function createResolve(stub, modules) {
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

      serializeModules(entryModuleName, resolve, function(modules) {
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

      serializeModules(entryModule.name, resolve, function(modules) {
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
    ])
  }
});

function testModules(entryModuleName, modules) {
  function serialize(stub, callback) {
    serializeModules(entryModuleName, createResolve(stub, modules), callback);
  }
  var modulesMap = mapFromModules(modules);

  return {
    'should create a serialization that contains each module exactly once': function(done) {
      serialize(this.stub(), function(result) {
        modules.forEach(function(module) {
          assert.containsOnce(result, module);
        });
        done();
      })
    },
    'should contain all dependencies in the correct order': function(done) {
      serialize(this.stub(), function(result) {
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
      })
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
