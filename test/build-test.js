var buster = require('buster');
require('buster-more-assertions');

var build = require('../src/build');
var assert = buster.assert;

function module(id, ast, dependencies) {
  return {id: id, ast: ast, dependencies: dependencies};
}

function getBody(ast) {
  return ast.expression.callee.body.body;
}

buster.testCase('build', {
  'returns an AST for an immediate function invocation': function() {
    var ast = build({}, []);
    assert.match(ast, {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression',
          params: [],
          body: { type: 'BlockStatement' /* body: left out */ }
        },
        arguments: []
      }
    });
    assert.isArray(getBody(ast));
  },

  'declares all identifiers within a single var statement': function() {
    var id1 = 'arbitrary1', id2 = 'arbitrary2', id3 = 'arbitrary3';
    var body = getBody(build({'a/b/c': id1, 'd/e/f': id2, 'g/h/i': id3}, []));
    var declaration = {
      type: 'VariableDeclaration',
      declarations: [
        { type: 'VariableDeclarator',
          id: { type: 'Identifier', name: id1 },
          init: null },
        { type: 'VariableDeclarator',
          id: { type: 'Identifier', name: id2 },
          init: null },
        { type: 'VariableDeclarator',
          id: { type: 'Identifier', name: id3 },
          init: null }
      ],
      kind: 'var'
    };
    assert.containsEqual(body, declaration);
  },

  'if a module factory is not a function, it is assigned to the correct variable': function() {
    var ast = {
      type: "MemberExpression",
      computed: false,
      object: { type: "Identifier", name: "Array" },
      property: { type: "Identifier", name: "prototype" }
    };
    var varName = '_1';
    var idMap = {'a/b/c': varName}, modules = [module('a/b/c', ast)];
    var body = getBody(build(idMap, modules));
    assert.containsEqual(body, {
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: { type: "Identifier", name: varName },
        right: ast
      }
    });
  },

  'if a module factory is a function, the result of it\'s invocation is assigned to the correct variable': function() {
    var ast = {
      type: "FunctionExpression",
      id: null,
      params: [],
      body: {
        type: "BlockStatement",
        body: [
          { type: "ReturnStatement",
            argument: { type: "Identifier", name: "arbitrary" } } ] }
    };
    var varName = 'arbitrary';
    var idMap = {'an/id': varName}, modules = [module('an/id', ast)];
    var body = getBody(build(idMap, modules));
    var callExpression = {
      type: "CallExpression",
      callee: ast,
      arguments: []
    };

    assert.containsEqual(body, {
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: { type: "Identifier", name: varName },
        right: callExpression
      }
    });
  },
  
  'modules factories with dependencies get the dependencies passed in': function() {}
});
