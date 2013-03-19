var buster = require('buster');
var serializeModules = require('../src/serialize-modules').serializeModules;

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
    ast: {}
  };
}
buster.testCase('serialize-modules', {
  'serializeModules': {

    'a simple module without dependencies': {
      'requests the entry module from the resolve function': function() {
        var resolve = this.spy();
        var entryModule = 'arbitrary/module';

        serializeModules(entryModule, resolve, function() {});

        assert.calledWith(resolve, entryModule);

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
    }
  }
});
