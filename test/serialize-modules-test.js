var buster = require('buster');
var serializeModules = require('../src/serialize-modules').serializeModules;

var format = require('util').format;

buster.assertions.add('containsInOrder', {
  assert: function(sequence, a, b) {
    var i = 3, iMax = arguments.length;
    do {
      if (sequence.indexOf(b) < sequence.indexOf(a)) {
        return false;
      }
      a = b;
      b = arguments[i];
      i += 1;
    } while(i < iMax);

    return true;
  },

  assertMessage: 'expected ${0} to contain ${1} in order',
  refuteMessage: 'expected ${0} not to contain ${1} in order',
  values: function(sequence) {
    return [sequence, [].slice.call(arguments, 1).join(', ')];
  }
});

function moduleToString() {
  var dependencies = this.dependencies;
  dependencies = dependencies ? format(' (%s)', dependencies.join(', ')) : ''
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
buster.testCase('serialize-modules', {
  'serializeModules': {

    'a simple module without dependencies': {
      'requests the entry module from the resolve function': function(done) {
        var entryModule = 'arbitrary/module';
        var resolve = createResolve(this.stub(), [createModule(entryModule)]);

        serializeModules(entryModule, resolve, function() {
          assert.calledWith(resolve, entryModule);
          done();
        });
      },

      'invokes the callback with an array containing the only module': function(done) {
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
      'requests the dependency from the resolver': function(done) {
        var entryModule = createModule('entry/module', ['a/dependency']);
        var dependencyModule = createModule('a/dependency');
        var resolve = createResolve(this.stub(), [entryModule, dependencyModule]);

        serializeModules(entryModule.name, resolve, function() {
          assert.calledWith(resolve, dependencyModule.name);
          done();
        });
      },

      'invokes the callback with the two modules, dependency first': function(done) {
        var entryModule = createModule('entry/module', ['dependency/module']);
        var dependencyModule = createModule('dependency/module');
        var resolve = createResolve(this.stub(), [entryModule, dependencyModule]);

        serializeModules(entryModule.name, resolve, function(modules) {
          assert.equals(modules, [dependencyModule, entryModule]);
          done();
        });
      }
    },

    'A tree of dependencies without repetitions': function(done) {
      var modules = [
        createModule('a', ['b', 'c']),
        createModule('b', ['d', 'e']),
        createModule('c', ['f', 'g']),
        createModule('d'),
        createModule('e'),
        createModule('f'),
        createModule('g')
      ];
      var modulesMap = modules.reduce(function(modules, module) {
        modules[module.name] = module;
        return modules;
      }, {});

      var resolve = createResolve(this.stub(), modules);

      serializeModules('a', resolve, function(result) {
        modules.forEach(function(module) {
          assert.contains(result, module);
          var dependencies = module.dependencies;
          if (dependencies) {
            dependencies.forEach(function(name) {
              assert.containsInOrder(result, modulesMap[name], module);
            });
          }
        });
        done();
      });
    }
  }
});
