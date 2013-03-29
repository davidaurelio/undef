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
    'passes the module id argument to the loader callback and adds the .js extension': function() {
      var loadFile = this.spy();
      var moduleId = 'arbitrary/id';
      var resolve = createResolve(loadFile, nop);

      resolve(moduleId, nop);
      assert.calledWith(loadFile, moduleId + '.js');
    },

    'passes the source yielded by the load function to the parse function': function() {
      var source = 'arbitrary source code';
      var loadFile = this.stub().yields(null, source);
      var parse = this.spy();
      var resolve = createResolve(loadFile, parse);

      resolve('arbitrary/id', nop);
      assert.calledWith(parse, source);
    },

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
      var ast = fixtures.anonymousDefineObject;
      var moduleAst = ast.body[0].expression.arguments[0];
      var parse = this.stub().yields(null, ast);
      var callback = this.spy();
      var resolve = createResolve(arbitraryLoadFile(this.stub()), parse);
      var moduleId = 'arbitrary/id';

      resolve(moduleId, callback);
      assert.calledWith(callback, null, module(moduleId, moduleAst));
    }
  }
});
