var buster = require('buster');
require('./assertions').addAll(buster.assertions);

var createResolve = require('../src/resolve').createResolve;
var assert = buster.assert, refute = buster.refute;

var fixtures = {
  anonymousDefineObject: require('./fixtures/anonymous-define-object.json'),
  anonymousWithDependencies: require('./fixtures/anonymous-define-dependencies.json'),
  anonymousWithRelativeDependencies: require('./fixtures/anonymous-define-relative-dependencies.json')
};

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
      var fixture = fixtures.anonymousDefineObject;
      var moduleAst = fixture.ast.body[0].expression.arguments[0];
      var moduleId = 'arbitrary/id';

      var loadFile = this.stub().
        withArgs(moduleId + '.js').yields(null, fixture.source).
        yields(null, null);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, function(error, module) {
        refute(error);
        assert.equals(module, createModule(moduleId, moduleAst));
        done();
      });
    },

    'the created module has the correct dependencies array': function(done) {
      var fixture = fixtures.anonymousWithDependencies;
      var defineCall = fixture.ast.body[0].expression;
      var dependencies = arrayFromAst(defineCall.arguments[0]);
      var moduleAst = defineCall.arguments[1];
      var moduleId = 'arbitrary/id';

      var loadFile = this.stub().
        withArgs(moduleId + '.js').yields(null, fixture.source).
        yields(null, null);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, function(error, module) {
        refute(error);
        assert.equals(module, createModule(moduleId, moduleAst, dependencies));
        done();
      });
    },

    'relative dependencies of the module are made absolute': function(done) {
      var fixture = fixtures.anonymousWithRelativeDependencies;
      var moduleId = 'f/g/h/i';

      var loadFile = this.stub().
        withArgs(moduleId + '.js').yields(null, fixture.source).
        yields(null, null);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, function(error, module) {
        refute(error);
        assert.equals(module.dependencies, ['f/g/h/b', 'f/g/c/d']);
        done();
      });
    }
  }
});


function arbitraryLoadFile(stub) {
  return stub.yields(null, 'arbitrary source');
}

function arbitraryParse(stub) {
  return stub.yields(null, {});
}

function arrayFromAst(arrayExpression) {
  var array = [], elements = arrayExpression.elements;
  for (var i = 0, n = elements.length; i < n; i += 1) {
    array[i] = elements[i].value;
  }
  return array;
}

function createModule(id, ast, dependencies) {
  return {id: id, ast: ast, dependencies: dependencies || null};
}

function createParseFixtures(stub) {
  stub.
    yields(null, {});

  for (var key in fixtures) {
    var fixture = fixtures[key];
    stub.withArgs(fixture.source).yields(null, fixture.ast);
  }

  return stub;
}

function nop() {}
