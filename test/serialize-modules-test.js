var buster = require('buster');
var esprima = require('esprima');
var serializeModules = require('../src/serialize-modules').serializeModules;
var format = require('util').format;

buster.testCase('serialize-modules', {
  'serializeModules': {

    'requests the entry module from the resolve function': function() {
      var resolve = this.spy();
      var entryModule = 'arbitrary/module';

      serializeModules(entryModule, resolve, function() {});

      assert.calledOnceWith(resolve, entryModule);

    },

    'invokes the callback': {
      'with a list of module names and a module map':
        function() {
          var entryModule = 'arbitrary/module';
          var moduleCode = '({arbitrary: "code"})';
          var moduleExpression = esprima.parse(moduleCode).body[0];
          var resolve = this.stub().callsArgWith(1, {
            type: 'module',
            name: entryModule,
            ast: moduleExpression
          });
          var callback = this.spy();

          serializeModules(entryModule, resolve, callback);

          var map = {};
          map[entryModule] = moduleExpression;
          assert.calledOnceWith(callback, [entryModule], map);
        }
    }
  }
});
