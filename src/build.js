module.exports = function(idmap, modules) {
  var idDeclaration = {
    type: 'VariableDeclaration',
    kind: 'var',
    declarations: values(idmap).map(declarator)
  };

  var body = [idDeclaration].concat(modules.map(function(module) {
    var ast = module.ast;
    if (ast.type === 'FunctionExpression') {
      var dependencies = module.dependencies;
      if (dependencies) {
        dependencies = dependencies.map(pluck.bind(null, idmap));
      }
      ast = callExpression(ast, dependencies);
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

function identifier(name) {
  return {type: 'Identifier', name: name};
}

function declarator(name) {
  return {
    type: 'VariableDeclarator',
    id: identifier(name),
    init: null
  };
}

function expressionStatement(expression) {
  return {
    type: 'ExpressionStatement',
    expression: expression
  };
}

function varAssignment(name, value) {
  return expressionStatement({
    type: 'AssignmentExpression',
    operator: '=',
    left: identifier(name),
    right: value
  });
}

function callExpression(callee, argNames) {
  var args = argNames ? argNames.map(identifier) : [];
  return { type: 'CallExpression', callee: callee, arguments: args };
}
