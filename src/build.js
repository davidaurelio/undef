module.exports = function(idmap, modules) {
  var idDeclaration = {
    type: 'VariableDeclaration',
    kind: 'var',
    declarations: values(idmap).map(declarator)
  };

  var body = [idDeclaration].concat(modules.map(function(module) {
    var ast = module.ast;
    if (ast.type === 'FunctionExpression') {
      ast = callExpression(ast);
    }
    return varAssignment(idmap[module.id], ast);
  }));
  return expressionStatement(callExpression({
    type: 'FunctionExpression',
    params: [],
    body: { type: 'BlockStatement', body: body }
  }));
};

function values(object) {
  return Object.keys(object).map(pluck.bind(null, object));
}

function pluck(object, key) { return object[key]; }

function declarator(name) {
  return {
    type: 'VariableDeclarator',
    id: {type: 'Identifier', name: name},
    init: null
  };
}

function expressionStatement(expression) {
  return {
    type: "ExpressionStatement",
    expression: expression
  };
}

function varAssignment(name, value) {
  return expressionStatement({
    type: "AssignmentExpression",
    operator: "=",
    left: { type: "Identifier", name: name },
    right: value
  });
}

function callExpression(callee) {
  return { type: "CallExpression", callee: callee, arguments: [] };
}
