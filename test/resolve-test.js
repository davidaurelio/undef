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
function module(name, ast) {
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
    'passes any error yielded by loadFile to the original callback': function() {
      var fileLoadError = Error('arbitrary');
      var loadFile = this.stub().yields(fileLoadError);
      var callback = this.spy();
      var resolve = createResolve(loadFile, arbitraryParse(this.stub()));

      resolve('arbitrary/id', callback);
      assert.calledWith(callback, fileLoadError);
    },

    'passes any error yielded by parse to the original callback': function() {
      var parseError = Error('arbitrary');
      var parse = this.stub().yields(parseError);
      var callback = this.spy();
      var resolve = createResolve(arbitraryLoadFile(this.stub()), parse);

      resolve('arbitrary/id', callback);
      assert.calledWith(callback, parseError);
    },

    'uses the ast returned by parse to create a module': function() {
      var source = 'module source';
      var ast = fixtures.anonymousDefineObject;
      var moduleAst = ast.body[0].expression.arguments[0];

      var loadFile = this.stub().
        withArgs('arbitrary/id.js').yields(null, source).
        yields(null, null);

      var parse = this.stub().
        withArgs(source).yields(null, ast).
        yields(null, null);

      var callback = this.spy();
      var resolve = createResolve(loadFile, parse);
      var moduleId = 'arbitrary/id';

      resolve(moduleId, callback);
      assert.calledWith(callback, null, module(moduleId, moduleAst));
    }
  }
});
