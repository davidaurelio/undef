var buster = require('buster');
require('buster-more-assertions');

var createResolve = require('../src/resolve').createResolve;
var assert = buster.assert, refute = buster.refute;

var fixtures = {
  anonymousDefineObject: require('./fixtures/anonymous-define-object.json'),
  anonymousWithDependencies: require('./fixtures/anonymous-define-dependencies.json'),
  anonymousWithRelativeDependencies: require('./fixtures/anonymous-define-relative-dependencies.json'),
  nonExpressionStatement: require('./fixtures/non-expression-statement.json'),
  nonExpressionStatementWithLoc: require('./fixtures/non-expression-statement-w-loc.json')
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

      resolve('arbitrary/id', done(function(error) {
        assert.equals(error, fileLoadError);
      }));
    },

    'passes any error yielded by parse to the original callback': function(done) {
      var parseError = Error('arbitrary');
      var parse = this.stub().yields(parseError);
      var resolve = createResolve(arbitraryLoadFile(this.stub()), parse);

      resolve('arbitrary/id', done(function(error) {
        assert.equals(error, parseError);
      }));
    },

    'uses the ast provided by parse to create a module': function(done) {
      var fixture = fixtures.anonymousDefineObject;
      var moduleAst = fixture.ast.body[0].expression.arguments[0];
      var moduleId = 'arbitrary/id';

      var loadFile = createLoadStub(this.stub(), moduleId, fixture);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, done(function(error, module) {
        refute(error);
        assert.equals(module, createModule(moduleId, moduleAst));
      }));
    },

    'the created module has the correct dependencies array': function(done) {
      var fixture = fixtures.anonymousWithDependencies;
      var defineCall = fixture.ast.body[0].expression;
      var dependencies = arrayFromAst(defineCall.arguments[0]);
      var moduleAst = defineCall.arguments[1];
      var moduleId = 'arbitrary/id';

      var loadFile = createLoadStub(this.stub(), moduleId, fixture);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, done(function(error, module) {
        refute(error);
        assert.equals(module, createModule(moduleId, moduleAst, dependencies));
      }));
    },

    'relative dependencies of the module are made absolute': function(done) {
      var fixture = fixtures.anonymousWithRelativeDependencies;
      var moduleId = 'f/g/h/i';
      var loadFile = createLoadStub(this.stub(), moduleId, fixture);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, done(function(error, module) {
        refute(error);
        assert.equals(module.dependencies, ['f/g/h/b', 'f/g/c/d']);
      }));
    },

    'returns an appropriate error with module id if a non-expression statement is encountered': function(done) {
      var fixture = fixtures.nonExpressionStatement;
      var moduleId = 'some/arbitrary/id';
      var loadFile = createLoadStub(this.stub(), moduleId, fixture);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, done(checkError(moduleId)));
    },

    'uses location information of the parse tree to create error messages': function(done) {
      var fixture = fixtures.nonExpressionStatementWithLoc;
      var line = fixture.ast.body[0].loc.start.line;
      var column = fixture.ast.body[0].loc.start.column;
      var moduleId = 'arbitrary/module';
      var loadFile = createLoadStub(this.stub(), moduleId, fixture);

      var parse = createParseFixtures(this.stub());
      var resolve = createResolve(loadFile, parse);

      resolve(moduleId, done(function(error) {
        assert.containsString(error, moduleId + ':' + line);

        var sourceLine = lines(fixture.source)[line - 1];
        assert.containsString(error, sourceLine.slice(column, 30));
      }));
    }
  }
});

function checkError(moduleId) {
  return function(error) {
    assert.match(error, /unexpected input/i);
    assert.containsString(error, moduleId);
  };
}

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

function createLoadStub(stub, moduleId, fixture) {
  return stub.withArgs(moduleId + '.js').
    yields(null, fixture.source).
    yields(null, null);
}

function lines(string) {
  return string.split(/\r?\n/);
}

function nop() {}
