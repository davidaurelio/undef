var buster = require('buster');
require('./assertions').addAll(buster.assertions);

var fixtures = {
  anonymousDefineObject: require('./fixtures/anonymous-define-object.json')
};

var createResolve = require('../src/resolve').createResolve;
var assert = buster.assert, refute = buster.refute;

function nop() {}
function arbitraryLoadFile(stub) {
  return stub.yields(null, 'arbitrary source');
}
function arbitraryParse(stub) {
  return stub.yields(null, {});
}
function createModule(name, ast) {
  return {
    name: name,
    ast: ast,
    dependencies: null
  };
}

buster.testCase('createResolve', {
  'creates a function': function() {
    assert.isFunction(createResolve(nop, nop));
  },

  'the created function': {
    'passes any error yielded by loadFile to the original callback': function(done) {
      var fileLoadError = Error('arbitrary');
      var loadFile = this.stub().yields(fileLoadError);
      var resolve = createResolve(loadFile, arbitraryParse(this.stub()));

      resolve('arbitrary/id', function(error) {
        assert.equals(error, fileLoadError);
        done();
      });
    },

    'passes any error yielded by parse to the original callback': function(done) {
      var parseError = Error('arbitrary');
      var parse = this.stub().yields(parseError);
      var resolve = createResolve(arbitraryLoadFile(this.stub()), parse);

      resolve('arbitrary/id', function(error) {
        assert.equals(error, parseError);
        done();
      });
    },

    'uses the ast provided by parse to create a module': function(done) {
      var source = 'module source';
      var ast = fixtures.anonymousDefineObject;
      var moduleAst = ast.body[0].expression.arguments[0];

      var loadFile = this.stub().
        withArgs('arbitrary/id.js').yields(null, source).
        yields(null, null);

      var parse = this.stub().
        withArgs(source).yields(null, ast).
        yields(null, null);

      var resolve = createResolve(loadFile, parse);
      var moduleId = 'arbitrary/id';

      resolve(moduleId, function(error, module) {
        refute(error);
        assert.equals(module, createModule(moduleId, moduleAst));
        done();
      });
    }
  }
});
