module.exports = function(modules) {
  return ['strict digraph "dependency tree" {']
    .concat(flatten(modules.map(toEdges)), ['}'])
    .join('\n');
};

function flatten(array) {
  return Array.prototype.concat.apply(Array.prototype, array);
}

function edge(id, dependency) {
  return JSON.stringify(id) + ' -> ' + JSON.stringify(dependency) + ';';
}

function toEdges(module) {
  var dependencies = module.dependencies, id = module.id;
  return dependencies ? dependencies.map(edge.bind(null, id)) : [];
}
